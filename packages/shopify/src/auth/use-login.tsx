import React, { useCallback, useEffect } from 'react'
import type { MutationHook } from '@vercel/commerce/utils/types'
import { CommerceError } from '@vercel/commerce/utils/errors'
import useLogin, { UseLogin } from '@vercel/commerce/auth/use-login'
import type { LoginHook } from '../types/login'
import useCustomer from '../customer/use-customer'
import { hdls_SwymConfig } from './../../../../site/lib/swym'

import {
  setCustomerToken,
  throwUserErrors,
  customerAccessTokenCreateMutation,
} from '../utils'
import { Mutation, MutationCustomerAccessTokenCreateArgs } from '../../schema'

export default useLogin as UseLogin<typeof handler>

export const handler: MutationHook<LoginHook> = {
  fetchOptions: {
    query: customerAccessTokenCreateMutation,
  },
  async fetcher({ input: { email, password }, options, fetch }) {
    if (!(email && password)) {
      throw new CommerceError({
        message: 'An email and password are required to login',
      })
    }

    const { customerAccessTokenCreate } = await fetch<
      Mutation,
      MutationCustomerAccessTokenCreateArgs
    >({
      ...options,
      variables: {
        input: { email, password },
      },
    })

    throwUserErrors(customerAccessTokenCreate?.customerUserErrors)

    const customerAccessToken = customerAccessTokenCreate?.customerAccessToken
    const accessToken = customerAccessToken?.accessToken

    if (accessToken) {
      setCustomerToken(accessToken)

      // console.log('Hdls - customer logged in', accessToken)

      var swymConfig = await hdls_SwymConfig(accessToken)

      console.log(swymConfig)
    }

    return null
  },
  useHook:
    ({ fetch }) =>
    () => {
      const { mutate } = useCustomer()

      return useCallback(
        async function login(input) {
          const data = await fetch({ input })
          await mutate()
          return data
        },
        [fetch, mutate]
      )
    },
}
