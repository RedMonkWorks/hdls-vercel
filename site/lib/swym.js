export default function SwymInit() {
  hdls_SetRegid()
  hdls_InjectWishlistCollection()
}

let hdls_ls_name = 'hdls_ls' // Local Storage Key storing auth and list objects

function hdls_StorageInitialize() {
  // Data from Swym Dashboard
  var hdls_ls = JSON.parse(localStorage.getItem(hdls_ls_name))

  if (hdls_ls === null) {
    console.log('Hdls - Initializing LocalStorage')

    const addObj = {
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

  var customerEmail = ''

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

    /* var clickable = true;
      
      if(typeof yashit.list.added !== "undefined")
      {
          Object.values(yashit.list.added).forEach((obj) => {
            if(productUrl === obj.du)
            {
              swymButton.disabled = !0;
              swymButton.style.opacity = 0.3;
              clickable = false;
              console.log("This item exists in Wishlist");
            }
          })
      }

      if(clickable) 
      {
        swymButton.onclick = function() {
          var wishlistDefault = new CustomEvent("wishlistVariant", {
            "detail": {"productUrl": productHandle}
          });
          
          document.dispatchEvent(wishlistDefault);
        };
      } */

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
    document.querySelectorAll('[href *= "/products/"]').forEach((card) => {
      var swymButton = document.createElement('button')
      swymButton.innerText = `${'\u2665'}`

      var productUrl = card.href
      var productHandle = productUrl.split('/products/')[1]
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

// document.addEventListener('wishlistVariant', function (e) {
//   var hdls_ls = JSON.parse(window.localStorage.getItem(hdls_ls_name))
//   var hdls_sessionid = hdls_GetCookie('hdls_sessionid')
//   var hdls_regid = hdls_GetCookie('hdls_regid')

//   var btn = document.querySelector(
//     `[data-product-url="${e.detail.productUrl}"]`
//   )

//   var wishlistModalForm = document.querySelector(
//     `.wishlist-modal[data-url="${e.detail.productUrl}"]`
//   )

//   // Create Modal Bkg if already doesn't exists
//   if (wishlistModalForm === null) {
//     var wishlistModal = document.createElement('div')
//     wishlistModal.setAttribute('class', 'wishlist-modal')
//     wishlistModal.setAttribute('data-url', e.detail.productUrl)
//     document.querySelector('body').appendChild(wishlistModal)

//     // Admin API call
//     var myHeaders = new Headers()
//     myHeaders.append('Content-Type', 'application/json')

//     var raw = JSON.stringify({
//       storeUrl: window.location.origin,
//       handle: e.detail.productHandle,
//     })

//     var requestOptions = {
//       method: 'POST',
//       headers: myHeaders,
//       body: raw,
//       redirect: 'follow',
//     }

//     fetch('http://localhost:5050/product', requestOptions)
//       .then((response) => response.text())
//       .then((data) => {
//         var jsonData = JSON.parse(data)
//         console.log('Hdls- Data From Shopify for Modal', jsonData)

//         // Create a form
//         var form = document.createElement('form')
//         form.setAttribute('id', 'wishlist-form')

//         form.innerHTML = `
//           <h2>Which variant do you want to add to Wishlist</h2>
//         `

//         jsonData.products[0].variants.forEach((obj, index) => {
//           form.innerHTML += `
//             <div class="wishlist-variants">
//               <img src="${jsonData.products[0].images[index].src}" width="50px">
//               <p>${obj.title}</p>
//               <input type="radio" name="hdls_variant" value="${obj.id}" ${
//             index === 0 ? 'checked' : ''
//           }>
//             </div>
//           `
//         })

//         var swymButton = document.createElement('button')
//         swymButton.setAttribute('second-product-url', e.detail.productUrl)
//         swymButton.innerText = 'Add To Wishlist'

//         swymButton.onclick = function (event) {
//           event.preventDefault()
//           var ele = document.getElementsByName('hdls_variant')
//           var hdls_ls = JSON.parse(window.localStorage.getItem(hdls_ls_name))

//           for (i = 0; i < ele.length; i++) {
//             if (ele[i].checked) {
//               fetch(
//                 `https://swymstore-v3dev-01-01.swymrelay.com/api/v3/lists/update-ctx?pid=${hdls_ls.auth.pid}`,
//                 {
//                   body: `regid=${hdls_regid}&sessionid=${hdls_sessionid}&lid=${hdls_ls.list.lid}&a=%5B%7B%20%22epi%22%3A${ele[i].value}%2C%20%22empi%22%3A${data.products[0].id}%2C%20%22du%22%3A%20%22${e.detail.productUrl}%22%2C%20%22cprops%22%3A%20%7B%7D%2C%20%22note%22%3A%20null%2C%20%22qty%22%3A%201%20%7D%5D`,
//                   headers: {
//                     Accept: 'application/json',
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                   },
//                   method: 'POST',
//                 }
//               )
//                 .then((response) => response.json())
//                 .then((data) => {
//                   hdls_ls = JSON.parse(
//                     window.localStorage.getItem(hdls_ls_name)
//                   )
//                   var length =
//                     typeof hdls_ls.list.added === 'undefined'
//                       ? 0
//                       : Object.keys(hdls_ls.list.added).length
//                   var respData = data.a[0]

//                   const addObj = {
//                     ...hdls_ls,
//                     list: {
//                       ...hdls_ls.list,
//                       added: {
//                         ...hdls_ls.list.added,
//                         [length]: {
//                           ...respData,
//                         },
//                       },
//                     },
//                   }

//                   window.localStorage.setItem(
//                     hdls_ls_name,
//                     JSON.stringify(addObj)
//                   )

//                   var submitWishlistBtn = document.querySelector(
//                     `[second-product-url="${e.detail.productUrl}"]`
//                   )

//                   document.querySelector(
//                     `.wishlist-modal[data-url="${e.detail.productUrl}"]`
//                   ).style.display = 'none'

//                   console.log('Hdls - Added variant to wishlist')
//                 })
//             }
//           }
//         }

//         form.appendChild(swymButton)

//         document
//           .querySelector(`.wishlist-modal[data-url="${e.detail.productUrl}"]`)
//           .appendChild(form)
//         console.log('Hdls - Added Wishlist Modal')
//       })
//   } else {
//     wishlistModalForm.style.display = 'block'
//   }
// })
