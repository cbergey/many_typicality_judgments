''' Code adapted from code by Robert Hawkins and Ashley Leung in this repo https://github.com/ashleychuikay/tangramgame/tree/master/experiments/comprehension '''
import pymongo as pm
import pandas as pd
import json

# this auth.json file contains credentials
with open('auth.json') as f :
    auth = json.load(f)

user = auth['user']
pswd = auth['password']
host = auth['host']

# initialize mongo connection
#conn = pm.MongoClient('mongodb://{}:{}@127.0.0.1'.format(user, pswd))
conn = pm.MongoClient('mongodb+srv://{}:{}@cluster0.vmf3v.mongodb.net/?retryWrites=true&w=majority'.format(user, pswd))

# get database for this project
db = conn['typicality-judgments']

# get stimuli collection from this database
#print('possible collections include: ', db.collection_names())
stim_coll = db['trial_set_stimuli']

# empty stimuli collection if already exists
# (note this destroys records of previous games)
if stim_coll.count_documents({}) != 0 :
    stim_coll.drop()

# Loop through evidence and insert into collection
trial_sets = pd.read_csv('./data/pairs_for_turk.csv')

for group_name, group in trial_sets.groupby('group') :
    trials = []
    for row_i, row in group.iterrows() :
        trials.append(row.to_dict())
    print(group_name)
    print(trials)
    packet = {
        'trials' : trials,
        'set_id' : group_name,
        'numGames': 0,
        'games' : []
    }
    stim_coll.insert_one(packet)

print('checking one of the docs in the collection...')
print(stim_coll.find_one())
