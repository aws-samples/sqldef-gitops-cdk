#!/bin/bash

set -eu

mysqldef -u $DB_USERNAME -p $DB_PASSWORD -h $DB_HOST $DB_NAME < sql/tables.sql
