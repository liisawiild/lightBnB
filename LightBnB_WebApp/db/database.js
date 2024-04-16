const { Pool } = require("pg");

const pool = new Pool({
  user:"labber",
  password:"labber",
  host:"localhost",
  database:"lightbnb"
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
  .query(`SELECT * FROM users WHERE email =  $1`, [email])
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
  return pool
  .query(`SELECT * FROM users WHERE id =  $1`, [id])
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
  return pool
  .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.email, user.password])
  .then((result) => {
    // console.log(result.rows[0]);
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
  return pool
  .query(`
    SELECT properties.*, reservations.id AS reservation_id, start_date, end_date, AVG(rating) AS average_rating
    FROM reservations
    JOIN properties ON property_id = properties.id 
    JOIN property_reviews ON property_reviews.property_id = properties.id
    WHERE reservations.guest_id = $1
    GROUP BY reservations.id, properties.id
    ORDER BY start_date ASC
    LIMIT $2
    ;
    `, [guest_id, limit])
    .then((result) => {
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
  const { city, owner_id, minimum_price_per_night, maximum_price_per_night, minimum_rating } = options
  const queryParams = [];
  
  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) AS average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;

  if (city) {
    queryParams.push(`%${city}%`);
    queryString += queryParams.length === 1 ? ' WHERE ' : ' AND '
    queryString += `city LIKE $${queryParams.length}`;
  }

  if (owner_id) {
    queryParams.push(`${owner_id}`);
    queryString += queryParams.length === 1 ? ' WHERE ' : ' AND '
    queryString += `owner_id = $${queryParams.length}`;
  }

  if (minimum_price_per_night && maximum_price_per_night) {
    queryParams.push(Number(minimum_price_per_night * 100));
    queryParams.push(Number(maximum_price_per_night * 100));
    queryString += queryParams.length === 2 ? ' WHERE ' : ' AND '
    queryString += `cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}`;
  }
  
  if (minimum_price_per_night) {
    queryParams.push(Number(minimum_price_per_night * 100));
    queryString += queryParams.length === 1 ? ' WHERE ' : ' AND '
    queryString += `cost_per_night >= $${queryParams.length}`;
  }

  if (maximum_price_per_night) {
    queryParams.push(Number(maximum_price_per_night * 100));
    queryString += queryParams.length === 1 ? ' WHERE ' : ' AND '
    queryString += `cost_per_night <= $${queryParams.length}`;
  }

  queryString += ` GROUP BY properties.id`

  if (minimum_rating) {
    queryParams.push(Number(minimum_rating));
    queryString += ` HAVING AVG(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length}
  ;
  `;

  return pool.query(queryString, queryParams).then((result) => {
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
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};


