#!/bin/bash
mongorestore -u root -p 123456 -h 127.0.0.1 --authenticationDatabase admin -d manage ./manage