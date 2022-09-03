const SWYM_HDLS_CONFIG = {
  storefrontAccessToken: '2742cc3153c315de9bc5a3d42046949e', //Get from Shopify Develop app
  storefrontGraphqlEndpoint:
    'https://swym-hdls-staging.myshopify.com/api/2021-07/graphql.json', //Shopiy Store url with graphql endpoint
  swymPid: 'BZJ3UlIxMXVCOCb++RWYUTLG2LilSFjX3A9fu9JepvM=', //Unique provider id from Swym Dashboard
  swymHost: 'https://swymstore-v3dev-01-01.swymrelay.com', //Get from Swym Dashboard
  swymLname: 'My Wishlist',
}

const SWYM_TEST = {
  pid: 'BZJ3UlIxMXVCOCb++RWYUTLG2LilSFjX3A9fu9JepvM=',
  lid: 'a9ffe748-d7c9-4d81-ad5c-244b48c55e43',
  regid:
    'MznZr5IO6zoeRiuIOsdvsPLvKdyWmXbwEKdYljFSm5VjOy7f2pyf2GTBtM7WbAkINwgNoVCrRvNhzZCkDfoxwedmFS80W_SFKQVnyhjXptK8O7QVV-tNyW-yj2xRkl3cd162JMKgGo-mcj6kcDmDAhLTZ_JIZtdc3Al9H62Q1n0',
  sessionid: '6436wzov2ccyjlxiyie5679836ci0f9sdxyxf1k9zkfhkbt9jc4d5qn5jewjl922',
  lname: 'My Wishlist',
}

let hdls_ls_name = 'hdls_ls' // Local Storage Key storing config and list objects

export default async function SwymInit() {
  const pageUrl = window.location.href

  // PDP page
  if (pageUrl.includes('/product/')) {
    var productHandle = pageUrl.split('/product/')[1]
    console.log(
      'Hdls - PDP recognized getting product data for handle:',
      productHandle
    )
    var productData = await hdls_ProductData(productHandle)

    hdls_VariantSelector(productData, productHandle)
  }

  // var listDetails = await hdls_getOrCreateDefaultWishlist(SWYM_TEST)
  // console.log(listDetails)
}

async function hdls_ProductData(productHandle) {
  //Gets product data from Shopify Storfront API
  var myHeaders = new Headers()
  myHeaders.append(
    'X-Shopify-Storefront-Access-Token',
    SWYM_HDLS_CONFIG.storefrontAccessToken
  )
  myHeaders.append('Content-Type', 'application/json')

  var graphql = JSON.stringify({
    query: `{
      product(handle: "${productHandle}") {
          id
          title
          onlineStoreUrl
          variants(first: 10) {
              edges {
                  node {
                      id
                      price
                      title
                      image {
                          id
                          src
                      }
                      selectedOptions {
                          name
                          value
                      }
                  }
              }
          }
          images(first: 1) {
            edges {
                node {
                    src
                }
            }
          }
          options {
              name
              values
          }
      }
    }`,
    variables: {},
  })
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: graphql,
    redirect: 'follow',
  }

  return fetch(SWYM_HDLS_CONFIG.storefrontGraphqlEndpoint, requestOptions)
    .then((response) => response.json())
    .then((result) => {
      console.log('Hdls - Product Data', result)
      return result.data.product
    })
    .catch((error) => {
      console.log('error', error)
      return error
    })
}

function hdls_VariantSelector(productData, productHandle) {
  var productId = window.atob(productData.id).split('gid://shopify/Product/')[1]
  var productUrl = window.location.origin + '/product/' + productHandle

  var wishlistModalForm = document.querySelector(`#empi-${productId}`)

  // Create Modal Bkg if already doesn't exists
  if (wishlistModalForm === null) {
    var wishlistModal = document.createElement('div')
    wishlistModal.setAttribute('class', 'wishlist-modal')
    wishlistModal.setAttribute('id', `empi-${productId}`)
    document.querySelector('body').appendChild(wishlistModal)

    // Create a form for variant selection
    var swymForm = document.createElement('form')
    swymForm.setAttribute('class', 'wishlist-form')

    swymForm.innerHTML = `
      <h2>Which variant do you want to add to Wishlist</h2>
      <img src="${productData.images.edges[0].node.src}" width="200px">
      <br>
    `

    // productData.variants.edges.forEach((obj, index) => {
    //   var variant = obj.node
    //   var variantId = window.atob(variant.id).split('gid://shopify/Product/')[1]
    //   swymForm.innerHTML += `
    //     <div class="wishlist-variants">
    //       <img src="${variant.image.src}" width="50px">
    //       <p>${variant.title}</p>
    //       <input type="radio" name="hdls_variant" value="${variantId}" ${
    //     index === 0 ? 'checked' : ''
    //   }>
    //     </div>
    //   `
    // })

    productData.options.forEach((option, index) => {
      swymForm.innerHTML += `
        <label value=${option.name}> ${option.name} </label>  
        <select>  
          ${variantOptions(option)}
        </select>
        <br>
      `
    })

    function variantOptions(option) {
      var options

      option.values.forEach((variant) => {
        options += `<option value = "${variant}"> ${variant} </option>`
      })

      return options
    }

    wishlistModal.appendChild(swymForm)

    var swymButton = document.createElement('button')
    swymButton.innerText = 'Add To Wishlist'

    swymButton.onclick = function (event) {
      event.preventDefault()

      var selection = document.querySelectorAll(
        `#empi-${productId} > form.wishlist-form > select`
      )
      var variantType = document.querySelectorAll(
        `#empi-7551725175004 > form.wishlist-form > label`
      )

      var selectedSelection = [],
        selectedType = []

      selection.forEach((obj) => {
        selectedSelection.push(obj.value)
      })
      variantType.forEach((obj) => {
        selectedType.push(obj.attributes.value.nodeValue)
      })

      productData.variants.edges.forEach((obj) => {
        var variantId = window
          .atob(obj.node.id)
          .split('gid://shopify/ProductVariant/')[1]
        var selectedOptions = obj.node.selectedOptions
        var variantFound = false

        selectedOptions.some((variant, index) => {
          var name = selectedType[index]
          var value = selectedSelection[index]

          if (name == variant.name && value == variant.value) {
            variantFound = true
          } else if (name != variant.name || value != variant.value) {
            variantFound = false
            return true
          }
        })

        if (variantFound) {
          hdls_AddToWishlist(productId, variantId, productUrl, SWYM_TEST)
        }
      })
    }

    swymForm.appendChild(swymButton)
  }
}

async function hdls_AddToWishlist(
  productId,
  variantId,
  productUrl,
  swymConfig
) {
  var myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')

  var urlencoded = new URLSearchParams()
  urlencoded.append('regid', swymConfig.regid)
  urlencoded.append('sessionid', swymConfig.sessionid)
  urlencoded.append('lid', swymConfig.lid)
  urlencoded.append(
    'a',
    `[{ "epi":${variantId}, "empi": ${productId}, "du":"${productUrl}", "cprops": {}, "note": null, "qty": 1 }]`
  )

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow',
  }

  return fetch(
    `https://swymstore-v3dev-01-01.swymrelay.com/api/v3/lists/update-ctx?pid=${encodeURIComponent(
      SWYM_HDLS_CONFIG.swymPid
    )}`,
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => {
      // hdls_ls = JSON.parse(window.localStorage.getItem(hdls_ls_name))
      // var length =
      //   typeof hdls_ls.list.added === 'undefined'
      //     ? 0
      //     : Object.keys(hdls_ls.list.added).length
      // var respData = data.a[0]

      // const addObj = {
      //   ...hdls_ls,
      //   list: {
      //     ...hdls_ls.list,
      //     added: {
      //       ...hdls_ls.list.added,
      //       [length]: {
      //         ...respData,
      //       },
      //     },
      //   },
      // }

      // window.localStorage.setItem(hdls_ls_name, JSON.stringify(addObj))

      // var submitWishlistBtn = document.querySelector(
      //   `[second-product-url="${e.detail.productUrl}"]`
      // )

      // document.querySelector(
      //   `.wishlist-modal[data-url="${e.detail.productUrl}"]`
      // ).style.display = 'none'

      console.log('Hdls - Added variant to wishlist', result)

      return result
    })
    .catch((error) => {
      console.log('error', error)

      return error
    })
}

async function hdls_DeleteFromWishlist(
  productId,
  variantId,
  productUrl,
  swymConfig
) {
  var myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')

  var urlencoded = new URLSearchParams()
  urlencoded.append('regid', swymConfig.regid)
  urlencoded.append('sessionid', swymConfig.sessionid)
  urlencoded.append('lid', swymConfig.lid)
  urlencoded.append(
    'd',
    `[{ "epi":${variantId}, "empi": ${productId}, "du":"${productUrl}", "cprops": {}, "note": null, "qty": 1 }]`
  )

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow',
  }

  return fetch(
    `https://swymstore-v3dev-01-01.swymrelay.com/api/v3/lists/update-ctx?pid=${encodeURIComponent(
      SWYM_HDLS_CONFIG.swymPid
    )}`,
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => {
      console.log('Hdls - Added variant to wishlist', result)

      return result
    })
    .catch((error) => {
      console.log('error', error)

      return error
    })
}

async function hdls_GetOrCreateDefaultWishlist(swymConfig) {
  console.log('Hdls - Fetching or Creating List for Current Regid')

  return fetch(
    `${
      SWYM_HDLS_CONFIG.swymHost
    }/api/v3/lists/fetch-lists?pid=${encodeURIComponent(
      SWYM_HDLS_CONFIG.swymPid
    )}`,
    {
      body: `regid=${swymConfig.regid}&sessionid=${swymConfig.sessionid}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    }
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.length) {
        console.log('Hdls - List Fetched for User')

        return data[0]
      } else {
        return fetch(
          `${
            SWYM_HDLS_CONFIG.swymHost
          }/api/v3/lists/create?pid=${encodeURIComponent(
            SWYM_HDLS_CONFIG.swymPid
          )}`,
          {
            body: `lname=${SWYM_HDLS_CONFIG.swymLname}&sessionid=${swymConfig.sessionid}&regid=${swymConfig.regid}`,
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: 'POST',
          }
        )
          .then((response) => response.json())
          .then((data) => {
            console.log('Hdls - List Created for User')

            return data
          })
      }
    })
}

export async function hdls_SwymConfig(customerToken) {
  if (customerToken != null) {
    console.log('Entered function', customerToken != null)

    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Accept', 'application/json')

    var raw = JSON.stringify({
      host: SWYM_HDLS_CONFIG.swymHost,
      email: 'yashit.thakur@swu=ymcorp.com',
      pid: SWYM_HDLS_CONFIG.swymPid,
    })

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    }

    return fetch('http://localhost:5050/auth', requestOptions)
      .then((response) => response.json())
      .then((result) => {
        console.log('Hdls - User Login Detected and RegID generated')

        const swymConfig = {
          regid: result.regid,
          sessionid: result.sessionid,
        }

        return swymConfig
      })
      .catch((error) => {
        console.log('error', error)

        return error
      })
  } else {
    return fetch(
      `${
        SWYM_HDLS_CONFIG.swymHost
      }/api/v3/provider/register?pid=${encodeURIComponent(
        SWYM_HDLS_CONFIG.swymPid
      )}`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      }
    )
      .then((response) => response.json())
      .then((result) => {
        console.log('Hdls - User Logout Detected and RegID generated')

        const swymConfig = {
          regid: result.regid,
          sessionid: hdls_CreateSessionid(64),
        }

        return swymConfig
      })
      .catch((error) => {
        console.log('error', error)

        return error
      })
  }
}

function hdls_StorageInitialize() {
  // Data from Swym Dashboard
  var hdls_ls = JSON.parse(localStorage.getItem(hdls_ls_name))

  if (hdls_ls === null) {
    console.log('Hdls - Initializing LocalStorage')

    const addObj = {
      // Editing by AB
      auth: {
        pid: 'bHewzq/rpPESDOscb6SoeiO2hDAQD69iWqvS0BPhWTY=',
        host: 'https://swymstore-v3dev-01-01.swymrelay.com',
      },
    }

    localStorage.setItem(hdls_ls_name, JSON.stringify(addObj))

    hdls_ls = JSON.parse(localStorage.getItem(hdls_ls_name))

    return hdls_ls
  } else {
    return hdls_ls
  }
}

function hdls_SetCookie(cName, cValue, expMin) {
  const d = new Date()
  d.setTime(d.getTime() + expMin * 60 * 1000)
  let expires = 'expires=' + d.toUTCString()
  document.cookie = cName + '=' + cValue + ';' + expires + ';path=/'
}

function hdls_GetCookie(cName) {
  let name = cName + '='
  let ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) == ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}

function hdls_CreateSessionid(len) {
  // Len is length usually 64
  var outStr = '',
    newStr
  while (outStr.length < len) {
    newStr = Math.random().toString(36 /*radix*/).slice(2 /* drop decimal*/)
    outStr += newStr.slice(0, Math.min(newStr.length, len - outStr.length))
  }

  return outStr.toLowerCase()
}

function hdls_SetSessionid() {
  if (hdls_GetCookie('hdls_sessionid') === '') {
    var sessionid = hdls_CreateSessionid(64)
    hdls_SetCookie('hdls_sessionid', sessionid, 30)
    return sessionid
  } else {
    return hdls_GetCookie('hdls_sessionid')
  }
}

async function hdls_SetRegid() {
  // Function to Set SessionID and RegID in Cookies and LS
  var hdls_ls = hdls_StorageInitialize()

  var customerEmail = '{{ customer.email }}'

  if (customerEmail !== '' && hdls_GetCookie('hdls_logged') !== 'yes') {
    // Customer Logged In
    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Accept', 'application/json')

    var raw = JSON.stringify({
      host: hdls_ls.auth.host,
      email: customerEmail,
      pid: hdls_ls.auth.pid,
    })

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    }

    return fetch('http://localhost:5050/auth', requestOptions)
      .then((response) => response.text())
      .then((data) => {
        console.log('Hdls - User Login Detected and RegID generated')
        var jsonData = JSON.parse(data)
        hdls_SetCookie('hdls_logged', 'yes', 21600)
        hdls_SetCookie('hdls_regid', jsonData.regid, 21600)
        hdls_SetCookie('hdls_sessionid', jsonData.sessionid, 30)

        const cookies = {
          regid: jsonData.regid,
          sessionid: jsonData.sessionid,
        }

        return cookies
      })
  } else if (customerEmail === '' && hdls_GetCookie('hdls_logged') === 'yes') {
    // Customer Logged out
    return fetch(
      `${hdls_ls.auth.host}/api/v3/provider/register?pid=${hdls_ls.auth.pid}`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log('Hdls - User Logout Detected and RegID generated')
        hdls_SetCookie('hdls_logged', '', 21600)
        hdls_SetCookie('hdls_regid', data.regid, 21600)

        var sessionid = hdls_SetSessionid()
        hdls_SetCookie('hdls_sessionid', sessionid, 30)

        const cookies = {
          regid: data.regid,
          sessionid: sessionid,
        }

        return cookies
      })
  } else if (customerEmail === '' && hdls_GetCookie('hdls_logged') === '') {
    // Anonymous User
    if (hdls_GetCookie('hdls_regid') === '') {
      return fetch(
        `${hdls_ls.auth.host}/api/v3/provider/register?pid=${hdls_ls.auth.pid}`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          method: 'POST',
        }
      )
        .then((response) => response.json())
        .then((data) => {
          console.log('Hdls - Anonymous User Detected and RegID generated')
          hdls_SetCookie('hdls_regid', data.regid, 21600)
          var sessionid = hdls_SetSessionid()
          hdls_SetCookie('hdls_sessionid', sessionid, 30)

          const cookies = {
            regid: data.regid,
            sessionid: sessionid,
          }

          return cookies
        })
    } else {
      console.log('Hdls - Anonymous user RegID exists')
      var sessionid = hdls_SetSessionid()
      hdls_SetCookie('hdls_sessionid', sessionid, 30)

      const cookies = {
        regid: hdls_GetCookie('hdls_regid'),
        sessionid: sessionid,
      }

      return cookies
    }
  }
}

async function hdls_CreateOrFetchList() {
  // Creates a List named "My Wishlist" or fetches list if exists for given regid
  console.log('Hdls - Fetching or Creating List for Current Regid')

  var hdls_ls = hdls_StorageInitialize()

  return hdls_SetRegid().then((cookies) => {
    var hdls_regid = cookies.regid
    var hdls_sessionid = cookies.sessionid

    console.log(cookies)

    return fetch(
      `${hdls_ls.auth.host}/api/v3/lists/fetch-lists?pid=${hdls_ls.auth.pid}`,
      {
        body: `regid=${hdls_regid}&sessionid=${hdls_sessionid}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.length) {
          console.log('Hdls - List Fetched for User')

          var listObj = data[0].listcontents

          const addObj = {
            ...hdls_ls,
            list: {
              lid: data[0].lid,
              lname: data[0].lname,
              di: data[0].di,
              added: {
                ...listObj,
              },
            },
          }

          localStorage.setItem(hdls_ls_name, JSON.stringify(addObj))

          return true
        } else {
          console.log('Hdls - List Created for User')

          return fetch(
            `${hdls_ls.auth.host}/api/v3/lists/create?pid=${hdls_ls.auth.pid}`,
            {
              body: `lname=My%20Wishlist&sessionid=${hdls_sessionid}&regid=${hdls_regid}`,
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              method: 'POST',
            }
          )
            .then((response) => response.json())
            .then((data) => {
              const addObj = {
                ...hdls_ls,
                list: {
                  ...data,
                },
              }

              localStorage.setItem(hdls_ls_name, JSON.stringify(addObj))

              return true
            })
        }
      })
  })
}

function hdls_InjectWishlistPDP() {
  var pageUrl = window.location.href.toString()
  var hdls_ls = hdls_StorageInitialize()

  if (pageUrl.includes('/products/')) {
    var swymButton = document.createElement('button')
    swymButton.innerText = `${'\u2665'} Wishlist`

    var productUrl = pageUrl
    var productHandle = productUrl.split('/products/')[1].split('?variant=')[0]
    var storeUrl = window.location.origin

    function setAttributes(element, attributes) {
      Object.keys(attributes).forEach((attr) => {
        element.setAttribute(attr, attributes[attr])
      })
    }

    const attributes = {
      class: `headless-button-pdp`,
      'data-product-url': `${productUrl}`,
    }

    setAttributes(swymButton, attributes)

    swymButton.onclick = function () {
      var wishlistDefault = new CustomEvent('wishlistDefault', {
        detail: {
          productUrl: window.location.href,
          productHandle: productHandle,
        },
      })

      // Create of fetch list if already doesn't exist
      hdls_CreateOrFetchList().then((response) => {
        if (response === true) {
          document.dispatchEvent(wishlistDefault)
        }
      })
    }

    document.querySelector('.product-form').appendChild(swymButton)
    console.log('Hdls - Injected Swym Wishlist Button')
  }
}

function hdls_InjectWishlistCollection() {
  var hdls_ls = hdls_StorageInitialize()

  if (
    !window.location.href.includes('/products/') &&
    !window.location.href.includes('/wishlist-dev')
  ) {
    console.log('Injecting buttons')
    document.querySelectorAll('[href *= "/product/"]').forEach((card) => {
      var swymButton = document.createElement('button')
      swymButton.innerText = `${'\u2665'}`

      var productUrl = card.href
      var productHandle = productUrl.split('/product/')[1]
      // console.log("ProductHandle ", productHandle);
      var storeUrl = window.location.origin

      function setAttributes(element, attributes) {
        Object.keys(attributes).forEach((attr) => {
          element.setAttribute(attr, attributes[attr])
        })
      }

      const attributes = {
        class: `headless-button`,
        'data-product-url': `${productUrl}`,
        style: 'z-index: 2; margin: 10px 0px; font-size: 1.5rem;',
      }

      setAttributes(swymButton, attributes)

      swymButton.onclick = function () {
        var wishlistDefault = new CustomEvent('wishlistVariant', {
          detail: { productUrl: productUrl, productHandle: productHandle },
        })

        // Create of fetch list if already doesn't exist
        hdls_CreateOrFetchList().then((response) => {
          if (response == true) {
            document.dispatchEvent(wishlistDefault)
          }
        })
      }

      card.insertAdjacentElement('beforebegin', swymButton)
    })
  }
}

// window.onload = function () {
//   hdls_SetRegid()

//   hdls_InjectWishlistPDP()

//   hdls_InjectWishlistCollection()
// }

// window.onclick = function (event) {
//   if (event.target.className === 'wishlist-modal') {
//     event.target.style.display = 'none'
//   }
// }

// document.addEventListener('wishlistDefault', async function (e) {
//   var hdls_ls = JSON.parse(window.localStorage.getItem(hdls_ls_name))
//   var hdls_sessionid = hdls_GetCookie('hdls_sessionid')
//   var hdls_regid = hdls_GetCookie('hdls_regid')

//   var btn = document.querySelector(
//     `[data-product-url="${
//       window.location.origin + '/products/' + e.detail.productHandle
//     }"]`
//   )

//   // Admin API call
//   var myHeaders = new Headers()
//   myHeaders.append('Content-Type', 'application/json')

//   var raw = JSON.stringify({
//     storeUrl: window.location.origin,
//     handle: e.detail.productHandle,
//   })

//   var requestOptions = {
//     method: 'POST',
//     headers: myHeaders,
//     body: raw,
//     redirect: 'follow',
//   }

//   fetch('http://localhost:5050/product', requestOptions)
//     .then((response) => response.text())
//     .then((data) => {
//       var jsonData = JSON.parse(data)
//       var productUrl = e.detail.productUrl
//       var variantId

//       if (productUrl.includes('?variant=')) {
//         variantId = productUrl.split('?variant=')[1]
//         console.log('Hdls - Variant detected with id ', variantId)
//       } else {
//         variantId = jsonData.products[0].variants[0].id
//         console.log('Hdls - No variant default with id ', variantId)
//       }

//       fetch(
//         `https://swymstore-v3dev-01-01.swymrelay.com/api/v3/lists/update-ctx?pid=${hdls_ls.auth.pid}`,
//         {
//           body: `regid=${hdls_regid}&sessionid=${hdls_sessionid}&lid=${
//             hdls_ls.list.lid
//           }&a=%5B%7B%20%22epi%22%3A${variantId}%2C%20%22empi%22%3A${
//             jsonData.products[0].id
//           }%2C%20%22du%22%3A%20%22${
//             window.location.origin + '/products/' + e.detail.productUrl
//           }%22%2C%20%22cprops%22%3A%20%7B%7D%2C%20%22note%22%3A%20null%2C%20%22qty%22%3A%201%20%7D%5D`,
//           headers: {
//             Accept: 'application/json',
//             'Content-Type': 'application/x-www-form-urlencoded',
//           },
//           method: 'POST',
//         }
//       )
//         .then((response) => response.json())
//         .then((data) => {
//           var length =
//             typeof hdls_ls.list.added === 'undefined'
//               ? 0
//               : Object.keys(hdls_ls.list.added).length

//           var respData = data.a[0]

//           const addObj = {
//             ...hdls_ls,
//             list: {
//               ...hdls_ls.list,
//               added: {
//                 ...hdls_ls.list.added,
//                 [length]: {
//                   ...respData,
//                 },
//               },
//             },
//           }

//           window.localStorage.setItem(hdls_ls_name, JSON.stringify(addObj))

//           // Wishlist Popup Logic
//           var wishlistSuccessDiv = document.createElement('div')
//           wishlistSuccessDiv.setAttribute('class', 'popup')
//           wishlistSuccessDiv.style.visibility = 'visible'

//           var wishlistSuccess = document.createElement('span')
//           wishlistSuccess.setAttribute('class', 'popuptext')
//           wishlistSuccess.setAttribute('id', 'myPopup')
//           wishlistSuccess.setAttribute('data-url', e.detail.productUrl)
//           wishlistSuccess.innerHTML = `<p>Added to Wishlist<p>`
//           wishlistSuccess.style.visibility = 'visible'

//           wishlistSuccessDiv.appendChild(wishlistSuccess)
//           btn.insertAdjacentElement('afterend', wishlistSuccessDiv)

//           console.log('Added Item to Wishlist')
//         })
//     })
// })

function abc() {
  var hdls_ls = JSON.parse(window.localStorage.getItem(hdls_ls_name))
  var hdls_sessionid = hdls_GetCookie('hdls_sessionid')
  var hdls_regid = hdls_GetCookie('hdls_regid')

  var btn = document.querySelector(
    `[data-product-url="${e.detail.productUrl}"]`
  )

  var wishlistModalForm = document.querySelector(
    `.wishlist-modal[data-url="${e.detail.productUrl}"]`
  )

  // Create Modal Bkg if already doesn't exists
  if (wishlistModalForm === null) {
    var wishlistModal = document.createElement('div')
    wishlistModal.setAttribute('class', 'wishlist-modal')
    wishlistModal.setAttribute('data-url', e.detail.productUrl)
    document.querySelector('body').appendChild(wishlistModal)

    // Admin API call
    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')

    var raw = JSON.stringify({
      storeUrl: window.location.origin,
      handle: e.detail.productHandle,
    })

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    }

    fetch('http://localhost:5050/product', requestOptions)
      .then((response) => response.text())
      .then((data) => {
        var jsonData = JSON.parse(data)
        console.log('Hdls- Data From Shopify for Modal', jsonData)

        // Create a form
        var form = document.createElement('form')
        form.setAttribute('id', 'wishlist-form')

        form.innerHTML = `
          <h2>Which variant do you want to add to Wishlist</h2>
        `

        jsonData.products[0].variants.forEach((obj, index) => {
          form.innerHTML += `
            <div class="wishlist-variants">
              <img src="${jsonData.products[0].images[index].src}" width="50px">
              <p>${obj.title}</p>
              <input type="radio" name="hdls_variant" value="${obj.id}" ${
            index === 0 ? 'checked' : ''
          }>
            </div>
          `
        })

        var swymButton = document.createElement('button')
        swymButton.setAttribute('second-product-url', e.detail.productUrl)
        swymButton.innerText = 'Add To Wishlist'

        swymButton.onclick = function (event) {
          event.preventDefault()
          var ele = document.getElementsByName('hdls_variant')
          var hdls_ls = JSON.parse(window.localStorage.getItem(hdls_ls_name))

          for (i = 0; i < ele.length; i++) {
            if (ele[i].checked) {
              fetch(
                `https://swymstore-v3dev-01-01.swymrelay.com/api/v3/lists/update-ctx?pid=${hdls_ls.auth.pid}`,
                {
                  body: `regid=${hdls_regid}&sessionid=${hdls_sessionid}&lid=${hdls_ls.list.lid}&a=%5B%7B%20%22epi%22%3A${ele[i].value}%2C%20%22empi%22%3A${data.products[0].id}%2C%20%22du%22%3A%20%22${e.detail.productUrl}%22%2C%20%22cprops%22%3A%20%7B%7D%2C%20%22note%22%3A%20null%2C%20%22qty%22%3A%201%20%7D%5D`,
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  method: 'POST',
                }
              )
                .then((response) => response.json())
                .then((data) => {
                  hdls_ls = JSON.parse(
                    window.localStorage.getItem(hdls_ls_name)
                  )
                  var length =
                    typeof hdls_ls.list.added === 'undefined'
                      ? 0
                      : Object.keys(hdls_ls.list.added).length
                  var respData = data.a[0]

                  const addObj = {
                    ...hdls_ls,
                    list: {
                      ...hdls_ls.list,
                      added: {
                        ...hdls_ls.list.added,
                        [length]: {
                          ...respData,
                        },
                      },
                    },
                  }

                  window.localStorage.setItem(
                    hdls_ls_name,
                    JSON.stringify(addObj)
                  )

                  var submitWishlistBtn = document.querySelector(
                    `[second-product-url="${e.detail.productUrl}"]`
                  )

                  document.querySelector(
                    `.wishlist-modal[data-url="${e.detail.productUrl}"]`
                  ).style.display = 'none'

                  console.log('Hdls - Added variant to wishlist')
                })
            }
          }
        }

        form.appendChild(swymButton)

        document
          .querySelector(`.wishlist-modal[data-url="${e.detail.productUrl}"]`)
          .appendChild(form)
        console.log('Hdls - Added Wishlist Modal')
      })
  } else {
    wishlistModalForm.style.display = 'block'
  }
}
