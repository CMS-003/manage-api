import { initMongo, initTable } from '#mongodb.js';
import Router from 'koa-router'
import _ from 'lodash'
import shortid from 'shortid';
import { v4, v7 } from 'uuid';

const router = new Router();

router.get('/', async ({ response, models }) => {
  const tables = [];
  Object.keys(models).forEach(table => {
    const fields = models[table].getAttributes();
    const data = { table, fields };
    tables.push(data);
  });
  response.success(tables);
});

router.get('/views', async ({ response, models }) => {
  const tables = [];
  const names = Object.keys(models);
  const schemas = await models.MJsonSchema.getAll({ lean: true });
  const map = _.keyBy(schemas, 'name');
  for (let i = 0; i < schemas.length; i++) {
    const name = schemas[i].name;
    const table = { name, forms: [], lists: [], title: '' };
    const views = await models.MView.getAll({ where: { table: name }, lean: true });
    table.forms = views.filter(view => view.type === 'form');
    table.lists = views.filter(view => view.type === 'list');
    if (map[name]) {
      table.title = map[name].title;
    }
    tables.push(table);
  }
  response.success({ items: tables });
});

router.post('/views', async ({ request, models, response }) => {
  const data = request.body;
  data._id = shortid.generate();
  data.order = 1;
  const result = await models.MView.create(request.body);
  response.success(result);
});

router.get('/schemas', async ({ response, models, config }) => {
  await initMongo(config.mongo_system_url);
  const schemas = await models.MJsonSchema.getAll({ lean: true });
  response.success(schemas);
});

router.get('/schemas/:name', async ({ params, response, models }) => {
  const doc = await models.MJsonSchema.getInfo({ where: params, lean: true });
  if (doc) {
    response.success(doc.schema);
  } else {
    response.fail({ message: 'NotFound' });
  }
});

router.put('/schemas/:name', async ({ params, request, response, dbs, models }) => {
  await models.MJsonSchema.update({ where: params, data: { $set: request.body } });
  const doc = await models.MJsonSchema.getInfo({ where: params, lean: true });
  if (doc && doc.status === 1 && dbs[doc.db]) {
    if(doc.status === 1) {
      await initTable(dbs[doc.db], doc);
    }else {
      delete models[doc.name]
      dbs[doc.db].deleteModel(doc.name)
    }
  }
  response.success();
});

router.post('/schemas/:name', async ({ params, request, response, dbs, models }) => {
  if (!request.body.table || !request.body.db) {
    return response.fail({ message: '参数错误' });
  }
  request.body._id = v7();
  await models.MJsonSchema.create(request.body);
  const doc = await models.MJsonSchema.getInfo({ where: params, lean: true });
  response.success(doc);
});

router.get('/:name/fields', async ({ params, response, models }) => {
  const name = params.name
  const fields = models[name].getAttributes();
  response.success(fields);
});

router.get('/:name/list', async ({ params, request, response, models }) => {
  const name = params.name;
  const hql = request.paginate();
  hql.lean = true;
  if (models[name]) {
    const items = await models[name].getList(hql);
    response.success({ items });
  } else {
    response.fail();
  }
});

router.post('/:name/data', async ({ params, request, response, models }) => {
  const name = params.name;
  if (name === 'Interface') {
    const total = await models.MInterface.sum();
    request.body._id = (total + 100001).toString();
  } else {
    request.body._id = v4();
  }
  request.body.createdAt = new Date();
  request.body.updatedAt = new Date();
  if (models[name]) {
    await models[name].create(request.body);
    response.success({ _id: request.body._id });
  } else {
    response.fail();
  }
});

router.put('/:name/data', async ({ params, request, response, models }) => {
  const name = params.name;
  request.body.updatedAt = new Date();
  const { _id, ...data } = request.body;
  if (_id && models[name]) {
    await models[name].update({ where: { _id }, data: { $set: data } });
    response.success();
  } else {
    response.fail();
  }
});

router.del('/:name/data/:_id', async ({ params, response, models }) => {
  const name = params.name;
  if (models[name]) {
    await models[name].destroy({ where: { _id: params._id } });
    response.success();
  } else {
    response.fail();
  }
});

router.get('/:name/views', async ({ params, response, models }) => {
  const result = { name: params.name, forms: [], lists: [] };
  const views = await models.MView.getAll({ where: { table: params.name }, lean: true });
  result.forms = views.filter(view => view.type === 'form');
  result.lists = views.filter(view => view.type === 'list');
  response.success(result);
});

router.get('/:table/views/:_id', async ({ params, response, models }) => {
  const doc = await models.MView.getInfo({ where: params, lean: true });
  if (doc) {
    response.success(doc);
  } else {
    response.fail();
  }
});

router.put('/:table/views/:_id', async ({ params, request, response, models }) => {
  await models.MView.update({ where: params, data: request.body });
  response.success();
});

router.get('/:name/json-schema', async ({ params, models, response }) => {
  const model = models[_.upperFirst(params.name)];
  if (model) {
    const json = model.getJsonSchema();
    response.success(json);
  } else {
    response.fail();
  }
})

export default router