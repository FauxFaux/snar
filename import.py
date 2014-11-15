#!/usr/bin/env python3

import sys
import xml.etree.cElementTree as ET
import psycopg2

# osmosis --read-pbf-fast greater-london-latest.osm.pbf --tag-filter accept-ways highway=\* --tag-filter reject-relations --used-node --write-xml
# -> dump.osm

# sudo -u postgres createdb osm
# sudo -u postgres createuser osm
# sudo -u postgres psql
# alter user osm set password='osm';
# grant all on database osm to osm;
# osm=# CREATE EXTENSION postgis;


conn = psycopg2.connect("dbname=osm user=osm password=osm host=localhost")
cursor = conn.cursor()

lastnd = None

for _, elem in ET.iterparse(sys.stdin, events=("start",)):
    if elem.tag in ('bounds', 'osm', 'tag', 'relation', 'member'):
        continue
    elif elem.tag == 'node':
        cursor.execute('insert into nodes (id, location) values (%s, %s)',
                       (int(elem.get('id')), str((float(elem.get('lat')), float(elem.get('lon'))))))
    elif elem.tag == 'way':
        lastnd = None
    elif elem.tag == 'nd':
        ref = int(elem.get('ref'))
        if lastnd:
            cursor.execute('insert into node_node (start, ends) values (%s, %s)',
                           (lastnd, ref))
        lastnd = ref
    else:
        raise Exception('wat: ' + elem.tag)

conn.commit()
cursor.close()
conn.close()
