#!/usr/bin/env python3

import psycopg2
import json
from urllib.parse import parse_qs

# uwsgi --http-socket :9000 --plugin python3 -w serve
# sagi uwsgi uwsgi-plugin-python3

conn = psycopg2.connect("dbname=osm user=osm password=osm host=localhost")


def application(env, start_response):
    uri = env['PATH_INFO']
    if uri != '/api/1/segs':
        start_response('404 na', [])
        return (uri + ' not found').encode('utf-8')

    qs = parse_qs(env['QUERY_STRING'])
    try:
        box = json.loads(qs.get('box', list()).pop())
    except KeyError:
        box = None

    if not isinstance(box, list) or 4 != len(box):
        start_response("400 ew", [])
        return "that ain't no box".encode('utf-8')

    start_response("200 k", [("Content-Type", "application/json"), ("Access-Control-Allow-Origin", "*")])
    cursor = conn.cursor()
    cursor.execute("""
SELECT
  ST_X(ST_StartPoint(line)) start_x,
  ST_Y(ST_StartPoint(line)) start_y,
  ST_X(ST_EndPoint(line))   end_x,
  ST_Y(ST_EndPoint(line))   end_y
FROM mat
WHERE ST_Intersects(line, ST_MakeBox2d(ST_MakePoint(%s,%s), ST_MakePoint(%s,%s)))
ORDER BY 1
    """,
    box)
    return json.dumps(cursor.fetchall(), separators=(',', ':')).encode('utf-8')
