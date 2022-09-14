import type { GetStaticPropsContext } from 'next'
import commerce from '@lib/api/commerce'
import { Layout } from '@components/common'
import { Text, Container, Skeleton } from '@components/ui'
import { useCustomer } from '@framework/customer'
import rangeMap from '@lib/range-map'
import { useEffect, useState } from 'react'
import {
  hdls_RefreshSwymConfig,
  hdls_GetOrCreateDefaultWishlist,
} from '@lib/swym'
import Image, { ImageProps } from 'next/image'
import ProductTag from '@components/product/ProductTag'
import cn from 'clsx'
import s from './../components/product/ProductCard/ProductCard.module.css'

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

export default function SwymWishlist() {
  const { data: customer } = useCustomer()
  // @ts-ignore Shopify - Fix this types
  // console.log(customer)

  const rootClassName = cn(s.root)

  let [list, setList] = useState([])

  useEffect(() => {
    var hdls_ls_name = 'hdls_ls'
    var config = JSON.parse(localStorage.getItem(hdls_ls_name) || '{}')
    // console.log(list.listcontents)
    hdls_GetOrCreateDefaultWishlist(config).then((data) => {
      setList(data.listcontents)
    })
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
                  key={l['epi']}
                  className="ProductCard_root__HqXTt ProductCard_simple__HMkuK animated fadeIn"
                  aria-label={l['dt']}
                  href={l['cprops']['ou']}
                >
                  <div className="ProductCard_header__qlwPO">
                    <h3 className="ProductCard_name__YciuQ">
                      <span>{l['dt']}</span>
                    </h3>
                    <div className="ProductCard_price___JB_V">
                      {l['pr']}.00 USD
                    </div>
                  </div>
                  <div className="ProductCard_imageContainer__G6HoR">
                    <div>
                      <Image
                        alt={l['dt'] || 'Product Image'}
                        src={l['iu']}
                        className="Wishlist_listImage ProductCard_productImage__nbfNy"
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

SwymWishlist.Layout = Layout
