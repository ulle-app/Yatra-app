import { useState, useEffect, useRef } from 'react'
import { X, Send, Sparkles, Loader2, ChevronDown } from 'lucide-react'
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
        "flex gap-3 max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "ml-auto flex-row-reverse" : ""
    )}>
        {isUser ? <UserAvatar /> : <NandiAvatar size="sm" />}
        <div className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
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
    <div className="flex gap-3 animate-in fade-in duration-300">
        <NandiAvatar size="sm" className="opacity-80" />
        <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
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
        "Crowd status now"
    ]
    return (
        <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            {suggestions.map((text, i) => (
                <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors text-xs py-1"
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

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
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
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-[360px] sm:w-[400px] h-[550px] mb-4 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 border-0 bg-gradient-to-b from-white to-orange-50/30">
                    {/* Header */}
                    <CardHeader className="p-0">
                        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <NandiAvatar size="md" className="border-white/30" />
                                    <div>
                                        <h3 className="font-bold text-lg tracking-tight">Nandi</h3>
                                        <p className="text-xs text-orange-100 flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            Divine Guide • Always here
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white/80 hover:text-white hover:bg-white/10 h-9 w-9 rounded-full"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <Separator className="bg-orange-200/50" />
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-4">
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

                    {/* Input Area */}
                    <CardFooter className="p-3 border-t bg-white">
                        <div className="flex gap-2 w-full">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about temples..."
                                className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-orange-500 focus-visible:border-orange-400 rounded-full px-4"
                                disabled={isLoading}
                            />
                            <Button
                                onClick={() => handleSend()}
                                disabled={isLoading || !input.trim()}
                                size="icon"
                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full h-10 w-10 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

            {/* Floating Toggle Button */}
            <Button
                onClick={handleToggle}
                className={cn(
                    "rounded-full h-16 w-16 shadow-xl transition-all duration-300 hover:scale-110 p-0 border-4",
                    isOpen
                        ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-red-300/50 rotate-180"
                        : "bg-white hover:bg-orange-50 border-orange-200/80 hover:border-orange-300"
                )}
            >
                {isOpen ? (
                    <X className="w-7 h-7 text-white" />
                ) : (
                    <div className="relative">
                        <img
                            src="/nandi-icon.png"
                            alt="Chat with Nandi"
                            className="w-12 h-12 object-contain drop-shadow-sm"
                        />
                        {/* Online indicator */}
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white" />
                        </span>
                    </div>
                )}
            </Button>
        </div>
    )
}
