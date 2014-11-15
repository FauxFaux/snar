#!/usr/bin/env python3

import psycopg2
import json

# uwsgi --http-socket :9000 --plugin python3 -w serve
# sagi uwsgi uwsgi-plugin-python3

conn = psycopg2.connect("dbname=osm user=osm password=osm host=localhost")


def application(environ, start_response):
    start_response("200 k", [("Content-Type", "application/json"), ("Access-Control-Allow-Origin", "*")])
    cursor = conn.cursor()
    cursor.execute("""
SELECT
  ST_X(ST_StartPoint(line)) start_x,
  ST_Y(ST_StartPoint(line)) start_y,
  ST_X(ST_EndPoint(line))   end_x,
  ST_Y(ST_EndPoint(line))   end_y
FROM mat
WHERE ST_Intersects(line, ST_MakeBox2d(ST_MakePoint(51.56253, -0.24655), ST_MakePoint(51.55386, -0.22284)))
ORDER BY 1;
    """)
    return json.dumps(cursor.fetchall()).encode('utf-8')
