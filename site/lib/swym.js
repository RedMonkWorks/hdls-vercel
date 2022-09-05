import { useEffect } from 'react'

const SWYM_HDLS_CONFIG = {
  storefrontAccessToken: '1164b762f8549554583031ac743f4747', //Get from Shopify Develop app
  storefrontGraphqlEndpoint:
    'https://swym-hdls-staging.myshopify.com/api/2021-07/graphql.json', //Shopiy Store url with graphql endpoint
  swymPid: 'BZJ3UlIxMXVCOCb++RWYUTLG2LilSFjX3A9fu9JepvM=', //Unique provider id from Swym Dashboard
  swymHost: 'https://swymstore-v3dev-01-01.swymrelay.com', //Get from Swym Dashboard
  swymLname: 'My Wishlist',
}

let SWYM_TEST = {
  // Only for yshit.thakur@swymcorp.com
  lid: '4539f3a8-006b-48e6-b7a5-9bd89652e416',
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

    var productForm = document.querySelector(
      '[aria-label="Add to Cart"]'
    ).parentElement

    var swymButton = document.createElement('button')

    swymButton.setAttribute(
      'class',
      'wishlistPdp ProductSidebar_button__13iVS Button_root__G_l9X'
    )

    swymButton.innerText += `${'\u2665'} Add To Wishlist`

    swymButton.onclick = async function (e) {
      e.preventDefault()

      var productData = await hdls_ProductData(productHandle)
      var productId = window
        .atob(productData.id)
        .split('gid://shopify/Product/')[1]
      var productUrl = window.location.origin + '/product/' + productHandle
      var variantId = window
        .atob(productData.variants.edges[0].node.id)
        .split('gid://shopify/ProductVariant/')[1]

      // This step is to get list details and set in SWYM_Test
      if (SWYM_TEST.regid == null) {
        hdls_SwymConfig(null).then((swymConfig) => {
          hdls_GetOrCreateDefaultWishlist(swymConfig).then((listConfig) => {
            var data = {
              ...swymConfig,
              ...listConfig,
            }
            console.log(data)
            hdls_SetSwymConfig(data).then((finalData) => {
              // Directly call below function when All data is available
              hdls_AddToWishlist(productId, variantId, productUrl, finalData)
            })
          })
        })
      } else {
        hdls_GetOrCreateDefaultWishlist(SWYM_TEST).then((listConfig) => {
          hdls_SetSwymConfig(listConfig).then((finalData) => {
            // Directly call below function when All data is available
            hdls_AddToWishlist(productId, variantId, productUrl, finalData)
          })
        })
      }

      console.log('Hdls - PDP Wishlist Button Clicked')
    }

    productForm.appendChild(swymButton)
  }

  // Collections pages
  if (
    pageUrl == 'http://localhost:3000/search/frontpage' ||
    pageUrl == 'http://localhost:3000/search'
  ) {
    console.log('Hdls - Collections page recognized')
    document.querySelectorAll('[href *= "/product/"]').forEach((card) => {
      var swymButton = document.createElement('button')
      swymButton.innerText = `${'\u2665'}`

      var productUrl = card.href
      var productHandle = productUrl.split('/product/')[1]

      swymButton.onclick = async function (e) {
        e.preventDefault()

        var productData = await hdls_ProductData(productHandle)

        hdls_VariantSelector(productData, productHandle)

        console.log('Hdls - Collection Wishlist Button Clicked')
      }

      console.log('In collections adding')

      card.appendChild(swymButton)
    })
  }

  window.onclick = function (event) {
    if (event.target.className === 'wishlist-modal') {
      event.target.style.display = 'none'
    }
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
      <h2 class="column-span-3">Which variant do you want to add to Wishlist</h2>
      <img class="column-span-3" src="${productData.images.edges[0].node.src}" width="200px">
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
        <select class="column-span-2">  
          ${variantOptions(option)}
        </select>
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
    swymButton.setAttribute(
      'class',
      'column-span-3 ProductSidebar_button__13iVS Button_root__G_l9X'
    )
    swymButton.innerText = 'Add To Wishlist'

    swymButton.onclick = async function (event) {
      event.preventDefault()

      var selection = document.querySelectorAll(
        `#empi-${productId} > form.wishlist-form > select`
      )
      var variantType = document.querySelectorAll(
        `#empi-${productId} > form.wishlist-form > label`
      )

      var selectedSelection = []
      var selectedType = []

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

          if (
            selectedType[index] == variant.name &&
            selectedSelection[index] == variant.value
          ) {
            variantFound = true
            // console.log(selectedSelection[index], variant.value, variantFound)
            // console.log(selectedType[index], variant.name)
          } else if (
            selectedType[index] != variant.name ||
            selectedSelection[index] != variant.value
          ) {
            variantFound = false
            // console.log(selectedSelection[index], variant.value, variantFound)
            // console.log(selectedType[index], variant.name)
            return true
          }
        })

        if (variantFound) {
          console.log('Hdls - Adding to wishlist', productUrl)

          if (SWYM_TEST.regid == null) {
            hdls_SwymConfig(null).then((swymConfig) => {
              hdls_GetOrCreateDefaultWishlist(swymConfig).then((listConfig) => {
                var data = {
                  ...swymConfig,
                  ...listConfig,
                }
                console.log(data)
                hdls_SetSwymConfig(data).then((finalData) => {
                  // Directly call below function when All data is available
                  hdls_AddToWishlist(
                    productId,
                    variantId,
                    productUrl,
                    finalData
                  )

                  document.querySelector(`#empi-${productId}`).style.display =
                    'none'
                })
              })
            })
          } else {
            hdls_GetOrCreateDefaultWishlist(SWYM_TEST).then((listConfig) => {
              hdls_SetSwymConfig(listConfig).then((finalData) => {
                // Directly call below function when All data is available
                hdls_AddToWishlist(productId, variantId, productUrl, finalData)

                document.querySelector(`#empi-${productId}`).style.display =
                  'none'
              })
            })
          }
        }
      })
    }

    swymForm.appendChild(swymButton)
  } else {
    wishlistModalForm.style.display = 'block'
  }
}

async function hdls_AddToWishlist(
  productId,
  variantId,
  productUrl,
  swymConfig
) {
  // console.log(productUrl)
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
    var data = await hdls_GetCustomerEmail(customerToken)

    console.log(data.data.customer)

    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Accept', 'application/json')

    var raw = JSON.stringify({
      host: SWYM_HDLS_CONFIG.swymHost,
      email: data.data.customer.email,
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

async function hdls_GetCustomerEmail(customerToken) {
  var myHeaders = new Headers()
  myHeaders.append(
    'X-Shopify-Storefront-Access-Token',
    SWYM_HDLS_CONFIG.storefrontAccessToken
  )
  myHeaders.append('Content-Type', 'application/json')

  var graphql = JSON.stringify({
    query: `{\n  customer(customerAccessToken : "${customerToken}") {\n    id\n    firstName\n    lastName\n    acceptsMarketing\n    email\n    phone\n  }\n}`,
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
      return result
    })
    .catch((error) => console.log('error', error))
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

export async function hdls_SetSwymConfig(swymConfig) {
  SWYM_TEST = {
    ...SWYM_TEST,
    ...swymConfig,
  }

  return SWYM_TEST
}
