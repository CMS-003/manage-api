export default {
  PORT: 3334,
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  mongo_system_url: process.env.mongo_system_url,
  mongo_manager_url: 'mongodb://root:123456@192.168.0.124:27017/manager?authSource=admin',
  mongo_content_url: 'mongodb://root:123456@192.168.0.124:27017/conetnt?authSource=admin',
  mongo_crawler_url: 'mongodb://root:123456@192.168.0.124:27017/crawler?authSource=admin',
  mq_url: 'http://guest:guest@10.0.15.240:5672',
  resource_api_prefix: 'http://127.0.0.1:3334',
  page_public_url: 'https://u67631x482.vicp.fun',
  USER_TOKEN_SECRET: 'lp#yBMS0f!4IleTVnpA@'
}