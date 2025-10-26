import Link from 'next/link'
import {
    Globe,
    Share2,
    MessageCircle,
    Link as LinkIcon,
    Send,
    Feather,
} from 'lucide-react'

export function SocialIcons() {
    return (
        <div className="flex flex-wrap justify-center gap-6">
            <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share"
                className="text-white/40 hover:text-blue-400 transition-colors duration-200">
                <Share2 className="size-5" />
            </Link>
            <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Message"
                className="text-white/40 hover:text-blue-400 transition-colors duration-200">
                <MessageCircle className="size-5" />
            </Link>
            <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Link"
                className="text-white/40 hover:text-blue-400 transition-colors duration-200">
                <LinkIcon className="size-5" />
            </Link>
            <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
                className="text-white/40 hover:text-blue-400 transition-colors duration-200">
                <Globe className="size-5" />
            </Link>
            <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Send"
                className="text-white/40 hover:text-blue-400 transition-colors duration-200">
                <Send className="size-5" />
            </Link>
            <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Write"
                className="text-white/40 hover:text-blue-400 transition-colors duration-200">
                <Feather className="size-5" />
            </Link>
        </div>
    )
}
