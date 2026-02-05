'use client'

import { useEffect, useState } from 'react'

type Platform = 'telegram' | 'vk' | 'web'

type AppUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string | null
}

export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>('web')
  const [user, setUser] = useState<AppUser | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      /* ---------- TELEGRAM ---------- */
      const tg = (window as any)?.Telegram?.WebApp

      const isTelegram =
        tg &&
        tg.initDataUnsafe &&
        tg.initDataUnsafe.user

      if (isTelegram) {
        tg.ready()
        tg.expand()

        const tgUser = tg.initDataUnsafe.user

        setPlatform('telegram')
        setUser({
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username ?? null,
        })

        setIsReady(true)
        return
      }

      /* ---------- VK ---------- */
      try {
        const bridgeModule = await import('@vkontakte/vk-bridge')
        const bridge = bridgeModule.default

        await bridge.send('VKWebAppInit')

        const vkUser = await bridge.send('VKWebAppGetUserInfo')

        setPlatform('vk')
        setUser({
          id: vkUser.id,
          first_name: vkUser.first_name,
          last_name: vkUser.last_name,
          username: vkUser.screen_name || vkUser.domain || null,
        })

        setIsReady(true)
        return
      } catch (e) {
        console.warn('VK init failed or not VK environment', e)
      }

      /* ---------- WEB ---------- */
      setPlatform('web')
      setUser(null)
      setIsReady(true)
    }

    void init()
  }, [])

  return {
    platform,
    user,
    isReady,
  }
}
