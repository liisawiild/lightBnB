SELECT reservations.id AS reservation_id, title, start_date, cost_per_night, AVG(rating) AS average_rating
FROM reservations
JOIN properties ON property_id = properties.id 
JOIN property_reviews ON property_reviews.property_id = properties.id
WHERE reservations.guest_id = 1
GROUP BY reservations.id, properties.id
ORDER BY start_date ASC
LIMIT 10
;