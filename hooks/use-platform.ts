import { useEffect, useState } from 'react'
import bridge from '@vkontakte/vk-bridge'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

interface VkUser {
  id: number
  first_name: string
  last_name: string
  screen_name?: string
  domain?: string
}

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    enable: () => void
    disable: () => void
    setText: (text: string) => void
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void
  }
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  initDataUnsafe: {
    user?: TelegramUser
    query_id?: string
    auth_date?: number
    hash?: string
  }
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

type Platform = 'telegram' | 'vk' | 'web'

export function usePlatform() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [vkUser, setVkUser] = useState<VkUser | null>(null)
  const [platform, setPlatform] = useState<Platform>('web')
  const [userUsername, setUserUsername] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      const tg = window?.Telegram?.WebApp
      if (tg) {
        tg.ready()
        tg.expand()
        const tgUser = tg.initDataUnsafe?.user || null
        setWebApp(tg)
        setUser(tgUser)
        setPlatform('telegram')
        setUserUsername(tgUser?.username ? `@${tgUser.username}` : null)
        setIsReady(true)
        return
      }

      try {
        await bridge.send('VKWebAppInit')
        const vkInfo: VkUser = await bridge.send('VKWebAppGetUserInfo')
        setVkUser(vkInfo)
        setPlatform('vk')
        const vkName = vkInfo.screen_name || vkInfo.domain
        setUserUsername(vkName ? `@${vkName}` : null)
        setIsReady(true)
        return
      } catch {
        // fall through to demo user
      }

      setUser({
        id: 123456789,
        first_name: 'Тест',
        last_name: 'Пользователь',
        username: 'test_user',
      })
      setPlatform('web')
      setUserUsername('@test_user')
      setIsReady(true)
    }

    void init()
  }, [])

  const resolvedUser = user || vkUser
  const resolvedName = resolvedUser
    ? `${resolvedUser.first_name}${resolvedUser.last_name ? ` ${resolvedUser.last_name}` : ''}`
    : 'Гость'

  return {
    platform,
    isReady,
    userId: resolvedUser ? resolvedUser.id.toString() : 'demo-user',
    userName: resolvedName,
    userUsername,
    webApp,
    rawUser: user,
    rawVkUser: vkUser,
  }
}
