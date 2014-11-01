CREATE TABLE node_node (
  start BIGINT NOT NULL REFERENCES nodes (id),
  ends  BIGINT NOT NULL REFERENCES nodes (id)
);
CREATE TABLE nodes (
  id       BIGINT PRIMARY KEY,
  location POINT NOT NULL
);

SELECT *
FROM nodes
WHERE location <@ box((51.56253, -0.24655), (51.55386, -0.22284));

SELECT
  location       f,
  (SELECT location
   FROM nodes
   WHERE id = r) t
FROM nodes
  INNER JOIN (SELECT
                start AS l,
                ends  AS r
              FROM node_node
              UNION ALL SELECT
                          ends AS k,
                          start
                        FROM node_node) s ON id = s.l
WHERE location <@ box('(51.56253,-0.24655)', '(51.55386,-0.22284)');