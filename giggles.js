let cachelist = [];
self.addEventListener('install', async function (installEvent) {
    self.skipWaiting();
    installEvent.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(cachelist);
            })
    );
  });
  self.addEventListener('fetch', async event => {
      try {
          event.respondWith(handle(event.request))
      } catch (msg) {
          event.respondWith(handleerr(event.request, msg))
      }
  });
  const handleerr = async (req, msg) => {
      return new Response(`<h1>也许出了点错误</h1>
      <b>${msg}</b>`, { headers: { "content-type": "text/html; charset=utf-8" } })
  }
  let cdn = {
      "gh": {
          jsdelivr: {
              "url": "https://jsdelivr.pai233.top/gh"
          },
          tianli: {
              "url": "https://cdn1.tianli0.top/gh"
          },
          ravi: {
              "url": "https://cdn.ravi.cool/gh"
          },
          jsdelivr: {
              "url": "https://cdn.jsdelivr.net/gh"
          },
          fastly: {
              "url": "https://fastly.jsdelivr.net/gh"
          },
          gcore: {
              "url": "https://gcore.jsdelivr.net/gh"
          },
          quantil: {
              "url": "https://quantil.jsdelivr.net/gh"
          }
      },
      "combine": {
          jsdelivr: {
              "url": "https://jsdelivr.pai233.top/combine"
          },
          tianli: {
              "url": "https://cdn1.tianli0.top/combine"
          },
          jsdelivr: {
              "url": "https://cdn.jsdelivr.net/combine"
          },
          jsdelivr_fastly: {
              "url": "https://fastly.jsdelivr.net/combine"
          },
          jsdelivr_gcore: {
              "url": "https://gcore.jsdelivr.net/combine"
          },
          quantil: {
              "url": "https://quantil.jsdelivr.net/combine"
          }
      },
      "npm": {
          eleme: {
              "url": "https://npm.elemecdn.com"
          },
          pai: {
              "url": "https://jsdelivr.pai233.top/npm"
          },
          zhimg: {
              "url": "https://unpkg.zhimg.com"
          },
          unpkg: {
              "url": "https://unpkg.com"
          },
          tianli: {
              "url": "https://cdn1.tianli0.top/npm"
          },
          onm: {
              "url": "https://jsd.onmicrosoft.cn/npm"
          },
          jsdelivr: {
              "url": "https://cdn.jsdelivr.net/npm"
          },
          fastly: {
              "url": "https://fastly.jsdelivr.net/npm"
          },
          gcore: {
              "url": "https://gcore.jsdelivr.net/npm"
          },
          arcitcgn: {
              "url": "https://adn.arcitcgn.cn"
          },
          bbj: {
              "url": "https://jsd.8b9.cn/npm"
          },
      }
  }
  const handle = async function (req) {
      const urlStr = req.url
      const domain = (urlStr.split('/'))[2]
      let urls = []
      for (let i in cdn) {
          for (let j in cdn[i]) {
              if (domain == cdn[i][j].url.split('https://')[1].split('/')[0] && urlStr.match(cdn[i][j].url)) {
                  urls = []
                  for (let k in cdn[i]) {
                      urls.push(urlStr.replace(cdn[i][j].url, cdn[i][k].url))
                  }
                  if (urlStr.indexOf('@latest/') > -1) {
                      return lfetch(urls, urlStr)
                  } else {
                      return caches.match(req).then(function (resp) {
                          return resp || lfetch(urls, urlStr).then(function (res) {
                              return caches.open(CACHE_NAME).then(function (cache) {
                                  cache.put(req, res.clone());
                                  return res;
                              });
                          });
                      })
                  }
              }
          }
      }
      return fetch(req)
  }
  const lfetch = async (urls, url) => {
      let controller = new AbortController();
      const PauseProgress = async (res) => {
          return new Response(await (res).arrayBuffer(), { status: res.status, headers: res.headers });
      };
      if (!Promise.any) {
          Promise.any = function (promises) {
              return new Promise((resolve, reject) => {
                  promises = Array.isArray(promises) ? promises : []
                  let len = promises.length
                  let errs = []
                  if (len === 0) return reject(new AggregateError('All promises were rejected'))
                  promises.forEach((promise) => {
                      promise.then(value => {
                          resolve(value)
                      }, err => {
                          len--
                          errs.push(err)
                          if (len === 0) {
                              reject(new AggregateError(errs))
                          }
                      })
                  })
              })
          }
      }
      return Promise.any(urls.map(urls => {
          return new Promise((resolve, reject) => {
              fetch(urls, {
                  signal: controller.signal
              })
                  .then(PauseProgress)
                  .then(res => {
                      if (res.status == 200) {
                          controller.abort();
                          resolve(res)
                      } else {
                          reject(res)
                      }
                  })
          })
      }))
  }