CREATE TABLE nodes (
  id       BIGINT PRIMARY KEY,
  location POINT NOT NULL
);

CREATE TABLE node_node (
  start BIGINT NOT NULL REFERENCES nodes (id),
  ends  BIGINT NOT NULL REFERENCES nodes (id)
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

-- ~5 seconds for London, analyze suggests it scans the table four times, which seems off; maybe it doesn't understand ararys?
CREATE TABLE mat AS SELECT ST_MakeLine(ST_MakePoint(starts[0], starts[1]), ST_MakePoint(ends[0], ends[1]))
                    FROM (SELECT
                            (SELECT location
                             FROM nodes
                             WHERE id = start) starts,
                            (SELECT location
                             FROM nodes
                             WHERE id = ends)  ends
                          FROM node_node) o;

-- ~5.5 seconds anyway for London
CREATE TABLE mat AS SELECT ST_MakeLine(starts, ends) line
                    FROM (SELECT
                            (SELECT ST_MakePoint(location [0], location [1])
                             FROM nodes
                             WHERE id = start) starts,
                            (SELECT ST_MakePoint(location [0], location [1])
                             FROM nodes
                             WHERE id = ends)  ends
                          FROM node_node) o;

-- ~ 5 seconds for London
CREATE INDEX mat_lines_geom ON mat USING GIST (line);

SELECT count(*)
FROM mat
WHERE ST_Intersects(st_makeline, ST_MakeBox2d(ST_MakePoint(51.56253, -0.24655), ST_MakePoint(51.55386, -0.22284)));


SELECT
  ST_X(ST_StartPoint(line)) start_x,
  ST_Y(ST_StartPoint(line)) start_y,
  ST_X(ST_EndPoint(line))   end_x,
  ST_Y(ST_EndPoint(line))   end_y
FROM mat
WHERE ST_Intersects(line, ST_MakeBox2d(ST_MakePoint(51.56253, -0.24655), ST_MakePoint(51.55386, -0.22284)))
ORDER BY 1;