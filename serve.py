#!/usr/bin/env python3

import psycopg2
import json

conn = psycopg2.connect("dbname=osm user=osm password=osm host=localhost")


def application(environ, start_response):
    start_response("200 k", [("Content-Type", "application/json"), ("Access-Control-Allow-Origin", "*")])
    cursor = conn.cursor()
    cursor.execute("""
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
    """)
    return json.dumps(cursor.fetchall()).replace('"', '').replace('(', '[').replace(')', ']').encode('utf-8')
