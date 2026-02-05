'use client'

import { useEffect, useState } from 'react'

type Platform = 'telegram' | 'vk' | 'web'

type TelegramUser = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

type VkUser = {
  id: number
  first_name: string
  last_name: string
  screen_name?: string
  domain?: string
}

export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>('web')
  const [user, setUser] = useState<TelegramUser | VkUser | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      /* ---------- TELEGRAM ---------- */
      const tg = (window as any)?.Telegram?.WebApp
const isTelegram =
  tg &&
  tg.initDataUnsafe &&
  Object.keys(tg.initDataUnsafe).length > 0

if (isTelegram) {
  tg.ready()
  tg.expand()

  const tgUser = tg.initDataUnsafe.user ?? null

  setPlatform('telegram')
  setUser(tgUser)
  setUsername(tgUser?.username ? '@${tgUser.username}' : null)
  setIsReady(true)
  return
}

      /* ---------- VK ---------- */
      try {
        const bridgeModule = await import('@vkontakte/vk-bridge')
        const bridge = bridgeModule.default

        await bridge.send('VKWebAppInit')

        const vkUser: VkUser = await bridge.send(
          'VKWebAppGetUserInfo'
        )

        setPlatform('vk')
        setUser(vkUser)

        const vkUsername =
          vkUser.screen_name || vkUser.domain || null

        setUsername(vkUsername ? `@${vkUsername}` : null)

        setIsReady(true)
        return
      } catch (e) {
        console.warn('VK init failed or not VK environment', e)
      }

      /* ---------- WEB FALLBACK ---------- */
      setPlatform('web')
      setUser(null)
      setUsername(null)
      setIsReady(true)
    }

    void init()
  }, [])

  return {
    platform,
    user,
    username,
    isReady,
  }
}
