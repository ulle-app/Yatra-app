import { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2, ChevronDown, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

// Nandi Avatar Component
const NandiAvatar = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-14 h-14'
    }
    return (
        <div className={cn(
            "rounded-full bg-gradient-to-br from-orange-100 to-amber-50 border-2 border-orange-200 shadow-md overflow-hidden flex-shrink-0",
            sizeClasses[size],
            className
        )}>
            <img
                src="/nandi-icon.png"
                alt="Nandi"
                className="w-full h-full object-cover"
            />
        </div>
    )
}

// User Avatar Component
const UserAvatar = ({ className = '' }) => (
    <div className={cn(
        "w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium shadow-md flex-shrink-0",
        className
    )}>
        U
    </div>
)

// Message Bubble Component
const MessageBubble = ({ message, isUser }) => (
    <div className={cn(
        "flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "ml-auto flex-row-reverse" : ""
    )}>
        {isUser ? <UserAvatar /> : <NandiAvatar size="sm" />}
        <div className={cn(
            "px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
            isUser
                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-md"
                : "bg-white border border-gray-100 text-gray-700 rounded-bl-md"
        )}>
            <FormattedMessage content={message.content} />
        </div>
    </div>
)

// Formatted Message with bold support
const FormattedMessage = ({ content }) => {
    if (!content) return null
    const parts = content.split(/(\*\*.*?\*\*)/g)
    return (
        <span>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
                }
                return <span key={i}>{part}</span>
            })}
        </span>
    )
}

// Typing Indicator
const TypingIndicator = () => (
    <div className="flex gap-2 sm:gap-3 animate-in fade-in duration-300">
        <NandiAvatar size="sm" className="opacity-80" />
        <div className="bg-white border border-gray-100 px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl rounded-bl-md shadow-sm">
            <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
            </div>
        </div>
    </div>
)

// Quick Action Chips
const QuickActions = ({ onSelect }) => {
    const suggestions = [
        "Temple timings",
        "Best time to visit",
        "Crowd status"
    ]
    return (
        <div className="flex flex-wrap gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-100 bg-gray-50/50">
            {suggestions.map((text, i) => (
                <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors text-xs py-1 px-2"
                    onClick={() => onSelect(text)}
                >
                    {text}
                </Badge>
            ))}
        </div>
    )
}

export function Chatbot() {
    const { isAuthenticated } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Namaste! 🙏 I am **Nandi**, your divine guide for this sacred Yatra. Ask me about temple timings, live crowd updates, or help planning your pilgrimage. Har Har Mahadev!"
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef(null)
    const inputRef = useRef(null)

    // Lock body scroll on mobile when chat is open
    useEffect(() => {
        if (isOpen && window.innerWidth < 640) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            // Delay focus on mobile to prevent keyboard issues
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    const handleSend = async (customMessage = null) => {
        const messageToSend = customMessage || input.trim()
        if (!messageToSend || isLoading) return

        setInput('')

        const currentMessages = [...messages, { role: 'user', content: messageToSend }]
        const history = currentMessages
            .slice(-10)
            .map(m => ({ role: m.role, content: m.content }))

        setMessages(currentMessages)
        setIsLoading(true)

        try {
            const token = localStorage.getItem('token')
            const headers = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`

            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message: messageToSend, history })
            })

            const data = await response.json()

            if (response.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "I apologize, but I'm having trouble connecting right now. Please try again later. 🙏"
                }])
            }
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting to the divine knowledge base. Please try again in a moment."
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleToggle = () => {
        if (!isAuthenticated && !isOpen) {
            setMessages([{
                role: 'assistant',
                content: "Namaste! 🙏 I am **Nandi**, your divine guide. Login to get personalized recommendations based on your favorites, or feel free to ask me anything about temples!"
            }])
        }
        setIsOpen(!isOpen)
    }

    return (
        <>
            {/* Mobile Full-Screen Overlay */}
            {isOpen && (
                <div className="sm:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200" onClick={() => setIsOpen(false)} />
            )}

            <div className={cn(
                "fixed z-50 flex flex-col items-end",
                isOpen
                    ? "inset-0 sm:inset-auto sm:bottom-6 sm:right-6"
                    : "bottom-4 right-4 sm:bottom-6 sm:right-6"
            )}>
                {/* Chat Window */}
                {isOpen && (
                    <Card className={cn(
                        "shadow-2xl flex flex-col overflow-hidden animate-in duration-300 border-0 bg-gradient-to-b from-white to-orange-50/30",
                        // Mobile: Full screen with safe area
                        "w-full h-full rounded-none",
                        // Desktop: Fixed size card
                        "sm:w-[400px] sm:h-[550px] sm:mb-4 sm:rounded-2xl sm:slide-in-from-bottom-5 sm:fade-in"
                    )}>
                        {/* Header */}
                        <CardHeader className="p-0 flex-shrink-0">
                            {/* Safe area padding for notched phones */}
                            <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 pt-safe-top">
                                <div className="text-white p-3 sm:p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <NandiAvatar size="md" className="border-white/30" />
                                            <div>
                                                <h3 className="font-bold text-base sm:text-lg tracking-tight">Nandi</h3>
                                                <p className="text-[11px] sm:text-xs text-orange-100 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
                                                    Divine Guide • Always here
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-white/80 hover:text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9 rounded-full"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        {/* Messages */}
                        <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
                            <ScrollArea className="h-full">
                                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                                    {messages.map((msg, idx) => (
                                        <MessageBubble
                                            key={idx}
                                            message={msg}
                                            isUser={msg.role === 'user'}
                                        />
                                    ))}
                                    {isLoading && <TypingIndicator />}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>
                        </CardContent>

                        {/* Quick Actions */}
                        {messages.length <= 2 && !isLoading && (
                            <QuickActions onSelect={(text) => handleSend(text)} />
                        )}

                        {/* Input Area - with safe area for home indicator */}
                        <CardFooter className="p-2 sm:p-3 border-t bg-white flex-shrink-0 pb-safe-bottom">
                            <div className="flex gap-2 w-full">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about temples..."
                                    className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-orange-500 focus-visible:border-orange-400 rounded-full px-4 h-11 sm:h-10 text-base sm:text-sm"
                                    disabled={isLoading}
                                />
                                <Button
                                    onClick={() => handleSend()}
                                    disabled={isLoading || !input.trim()}
                                    size="icon"
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full h-11 w-11 sm:h-10 sm:w-10 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5 sm:w-4 sm:h-4" />
                                    )}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                )}

                {/* Floating Toggle Button - Hidden on mobile when open */}
                {!isOpen && (
                    <Button
                        onClick={handleToggle}
                        className={cn(
                            "rounded-full shadow-xl transition-all duration-300 hover:scale-110 p-0 border-4",
                            "h-14 w-14 sm:h-16 sm:w-16",
                            "bg-white hover:bg-orange-50 border-orange-200/80 hover:border-orange-300"
                        )}
                    >
                        <div className="relative">
                            <img
                                src="/nandi-icon.png"
                                alt="Chat with Nandi"
                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm"
                            />
                            {/* Online indicator */}
                            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-3 w-3 sm:h-4 sm:w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-green-500 border-2 border-white" />
                            </span>
                        </div>
                    </Button>
                )}
            </div>
        </>
    )
}
