// lamda getstream feed and activity for brand

const stream = require('getstream');

exports.handle = (event, context) => {
   Promise.all(event.Records.map((record) => {
      const oldItem = reduceObject(record.dynamodb.OldImage || {});
      const newItem = reduceObject(record.dynamodb.NewImage || {});
      const id = newItem.id || oldItem.id;
      console.log('Data:', id, 'Event:', record.eventName);
      switch(record.eventName) {
        case "INSERT":
          return addActivity(newItem, id);
        case "MODIFY":
          return updateActivity(newItem, id);
        case "REMOVE":
          return removeActivity(id);
        default: return Promise.resolve({});
      }
   }))
   .then((res) => context.succeed(JSON.stringify(res)))
   .catch((error) => context.fail(JSON.stringify(error)))
}

const reduceObject = (oldObject) => Object.keys(oldObject).reduce((obj, key) => Object.assign(obj, {[key]: oldObject[key][Object.keys(oldObject[key])]}), {});
const client = stream.connect(process.env.API_KEY, process.env.API_SECRET, process.env.APP_ID);

const addActivity = (data, id) => {
  const brand = client.feed('brand', 'id');

  return brand.addActivity({
    data,
    object: id,
    verb: 'add',
    actor: data.name,
    foreign_id: id,
  })
}

const updateActivity = (data, id) => {
  const now = new Date();

  return client.updateActivities([{
    data,
    object: id,
    verb: 'like',
    actor: data.name,
    foreign_id: id,
    time: now.toISOString(),
  }]);
}

const removeActivity = (foreignId) => {
  const brand = client.feed('brand', 'foreignId');
  return brand.removeActivity({ foreignId });
}
