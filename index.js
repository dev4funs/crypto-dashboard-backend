const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
}

function handleOptions(request) {
  // Make sure the necessary headers are present
  // for this to be a valid pre-flight request
  let headers = request.headers
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS pre-flight request.
    // If you want to check or reject the requested method + headers
    // you can do that here.
    let respHeaders = {
      ...corsHeaders,
      // Allow all future content Request headers to go back to browser
      // such as Authorization (Bearer) or X-Client-Name-Version
      'Access-Control-Allow-Headers': request.headers.get(
        'Access-Control-Request-Headers',
      ),
    }
    return new Response(null, {
      headers: respHeaders,
    })
  } else {
    // Handle standard OPTIONS request.
    // If you want to allow other HTTP Methods, you can do that here.
    return new Response(null, {
      headers: {
        Allow: 'GET, HEAD, POST, OPTIONS',
      },
    })
  }
}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const { pathname, searchParams } = new URL(request.url)
  let response

  if (request.method === 'OPTIONS') {
    response = handleOptions(request)
  } else {
    if (request.method === 'GET') {
      if (pathname.startsWith('/')) {
        response = new Response('Hello worker!', {
          headers: { 'content-type': 'text/plain' },
        })
      }
      if (pathname.startsWith('/news')) {
        const res = await getNews()
        console.log(res)
        response = new Response(res, {
          headers: { 'content-type': 'application/json;charset=UTF-8' },
        })
      }
      if (pathname.startsWith('/getCurrencyExchangeRate')) {
        const res = await getRate(
          searchParams.get('from_currency'),
          searchParams.get('to_currency'),
        )
        console.log(res)
        response = new Response(res, {
          headers: { 'content-type': 'application/json;charset=UTF-8' },
        })
      }
    } else {
      response = new Response('Expected GET', { status: 500 })
    }
  }

  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  )

  return response
}

/**
 * gatherResponse awaits and returns a response body as a string.
 * Use await gatherResponse(..) in an async function to get the response body
 * @param {Response} response
 */
async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    console.log('json')
    return JSON.stringify(await response.json())
  } else if (contentType.includes('application/text')) {
    return response.text()
  } else if (contentType.includes('text/html')) {
    return response.text()
  } else {
    return response.text()
  }
}

const getNews = async () => {
  const options = {
    headers: {
      'x-rapidapi-host': 'crypto-news-live3.p.rapidapi.com',
      'x-rapidapi-key': REACT_APP_RAPID_API_KEY,
    },
  }
  const response = await fetch(
    'https://crypto-news-live3.p.rapidapi.com/news',
    options,
  )
  console.log('response', response)
  return await gatherResponse(response)
}

const getRate = async (from_currency, to_currency) => {
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-host': 'alpha-vantage.p.rapidapi.com',
      'x-rapidapi-key': REACT_APP_RAPID_API_KEY,
    },
  }
  const params = {
    from_currency,
    function: 'CURRENCY_EXCHANGE_RATE',
    to_currency,
  }
  let url = new URL('https://alpha-vantage.p.rapidapi.com/query')
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
  const response = await fetch(url, options)
  return await gatherResponse(response)
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
