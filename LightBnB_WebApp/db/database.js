const { Pool } = require("pg");

const pool = new Pool({
  user: "labber",
  password: "labber",
  host: "localhost",
  database: "lightbnb"
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const queryString = `SELECT * FROM users WHERE email = $1;`;
  const queryParams = [email];

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      return err.message;
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const queryString = `SELECT * FROM users WHERE id = $1;`;
  const queryParams = [id];

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      return err.message;
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const { name, email, password } = user;

  const queryString = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`;
  const queryParams = [name, email, password];

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      return err.message;
    });
};


/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `
    SELECT properties.*, reservations.id AS reservation_id, start_date, end_date, AVG(rating) AS average_rating
    FROM reservations
    JOIN properties ON property_id = properties.id 
    JOIN property_reviews ON property_reviews.property_id = properties.id
    WHERE reservations.guest_id = $1
    GROUP BY reservations.id, properties.id
    ORDER BY start_date ASC
    LIMIT $2
    ;
    `;
  const queryParams = [guest_id, limit];

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      return err.message;
    })
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const { city, owner_id, minimum_price_per_night, maximum_price_per_night, minimum_rating } = options;
  
  const queryParams = [];
  // Begin the queryString but leave it open-ended (notice let) based on the incoming arguments from the options object (search form fields)
  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) AS average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;

  // Search Filter: if city is input it will add 'WHERE city LIKE' clauses to the queryString to only return properties in that city
  if (city) {
    queryParams.push(`%${city}%`);
    queryString += queryParams.length === 1 ? ' WHERE ' : ' AND '
    queryString += `city LIKE $${queryParams.length}`;
  }

  // For My Listings: if a listing was created the owner_id will be used to populate their properties
  if (owner_id) {
    queryParams.push(Number(owner_id));
    queryString += queryParams.length === 1 ? ' WHERE ' : ' AND '
    queryString += `owner_id = $${queryParams.length}`;
  }

  // Search Filter: if minimum and maximum cost is input, a clause for a cost_per_night range with those values will be added to the queryString
  if (minimum_price_per_night && maximum_price_per_night) {
    queryParams.push(Number(minimum_price_per_night * 100));
    queryParams.push(Number(maximum_price_per_night * 100));
    queryString += queryParams.length === 2 ? ' WHERE ' : ' AND '
    queryString += `cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}`;
  }

  // Search Filter: if a minimum cost is input, a clause for a cost_per_night will be added to the queryString to only pull properties that cost more than the min value
  if (minimum_price_per_night) {
    queryParams.push(Number(minimum_price_per_night * 100));
    queryString += queryParams.length === 1 ? ' WHERE ' : ' AND '
    queryString += `cost_per_night >= $${queryParams.length}`;
  }

  // Search Filter: if a maximum cost is input, a clause for a cost_per_night will be added to the queryString to only pull properties that cost less than the max value
  if (maximum_price_per_night) {
    queryParams.push(Number(maximum_price_per_night * 100));
    queryString += queryParams.length === 1 ? ' WHERE ' : ' AND '
    queryString += `cost_per_night <= $${queryParams.length}`;
  }

  // GROUP BY clause must come after any WHERE clause and therefore must wait for the above statements to run before being added to the queryString
  queryString += ` GROUP BY properties.id`;

  // HAVING must come after GROUP BY 
  if (minimum_rating) {
    queryParams.push(Number(minimum_rating));
    queryString += ` HAVING AVG(property_reviews.rating) >= $${queryParams.length}`;
  }

  // ORDER BY and LIMIT are added last and limit is pulled as a default value from line 8 of the routes/apiRoutes.js
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length}
  ;
  `;

  // Runs the query with the newly made queryString and queryParams (based on search filter) which will return an array of property objects
  return pool.query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      return err.stack;
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const {
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  } = property;

  const queryParams = [
      owner_id,
      title,
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night,
      street,
      city,
      province,
      post_code,
      country,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms
  ];

  const queryString = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 , $12, $13, $14)
  RETURNING *;
  `

  return pool.query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      return err.message
    })
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};


