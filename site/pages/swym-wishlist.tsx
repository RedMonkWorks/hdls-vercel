import type { GetStaticPropsContext } from 'next'
import commerce from '@lib/api/commerce'
import { Layout } from '@components/common'
import { Text, Container, Skeleton } from '@components/ui'
import { useCustomer } from '@framework/customer'
import rangeMap from '@lib/range-map'
import { useEffect, useState } from 'react'
import { hdls_RefreshSwymConfig } from '@lib/swym'
import Image, { ImageProps } from 'next/image'
import ProductTag from '@components/product/ProductTag'

export async function getStaticProps({
  preview,
  locale,
  locales,
}: GetStaticPropsContext) {
  const config = { locale, locales }
  const pagesPromise = commerce.getAllPages({ config, preview })
  const siteInfoPromise = commerce.getSiteInfo({ config, preview })
  const { pages } = await pagesPromise
  const { categories } = await siteInfoPromise

  return {
    props: {
      pages,
      categories,
    },
  }
}

export default function Wishlist() {
  const { data: customer } = useCustomer()
  // @ts-ignore Shopify - Fix this types
  // console.log(customer)

  let [list, setList] = useState([])

  useEffect(() => {
    var list = JSON.parse(localStorage.getItem('hdls_ls'))
    // console.log(list.listcontents)
    setList(list.listcontents)
  }, [])

  return (
    <Container>
      <div className="mt-3 mb-20">
        <Text variant="pageHeading">My Wishlist</Text>
        <div className="group flex flex-col">
          <div className="col-span-8 order-3 lg:order-none">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list?.map((l) => (
                <a
                  key={l.epi}
                  class="ProductCard_root__HqXTt ProductCard_simple__HMkuK animated fadeIn"
                  aria-label={l.dt}
                  href={l.cprops.ou}
                >
                  <div class="ProductCard_header__qlwPO">
                    <h3 class="ProductCard_name__YciuQ">
                      <span>Greed Jacket</span>
                    </h3>
                    <div class="ProductCard_price___JB_V">$161.00 USD</div>
                  </div>
                  <div className="ProductCard_imageContainer__G6HoR">
                    <div>
                      <Image
                        alt={l.dt || 'Product Image'}
                        src={l.iu}
                        className="ProductCard_productImage__nbfNy"
                        height={320}
                        width={320}
                        quality="85"
                        layout="responsive"
                      />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

Wishlist.Layout = Layout

{
  /* <p>{l.dt}</p>
                <div className="ProductCard_imageContainer__G6HoR">
                  <Image
                    quality="85"
                    src={l.iu}
                    height={320}
                    width={320}
                    layout="fixed"
                  />
                </div> */
  // href={`${l.du.substring(l.du.indexOf('/product/') + 1)}`}
}
