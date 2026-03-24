"use client"

import { useState } from "react"
import Image from "next/image"

interface PhotoImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  sizes?: string
  onClick?: () => void
}

export default function PhotoImage({
  src,
  alt,
  width,
  height,
  className = "",
  fill = false,
  priority = false,
  sizes,
  onClick,
}: PhotoImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Calculate aspect ratio for skeleton
  const aspectRatio = width && height ? height / width : 0.75

  if (error) {
    return (
      <div 
        className={`bg-secondary flex items-center justify-center ${className}`}
        style={!fill && width && height ? { aspectRatio: `${width}/${height}` } : undefined}
      >
        <div className="text-muted-foreground text-xs text-center p-2">
          <svg className="w-6 h-6 mx-auto mb-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Failed to load
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={!fill && width && height ? { aspectRatio: `${width}/${height}` } : undefined}
      onClick={onClick}
    >
      {/* Skeleton placeholder while loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-secondary animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent skeleton-shimmer" />
        </div>
      )}
      
      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes || "(max-width: 768px) 50vw, 33vw"}
          priority={priority}
          className={`object-cover transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setError(true)
          }}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width || 400}
          height={height || 300}
          sizes={sizes || "(max-width: 768px) 50vw, 33vw"}
          priority={priority}
          className={`w-full h-auto object-cover transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setError(true)
          }}
        />
      )}
    </div>
  )
}
