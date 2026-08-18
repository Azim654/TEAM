import defaultAvatar from "../../assets/images/default-avatar.svg"

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: number
  className?: string
  onClick?: () => void
}

function Avatar({ src, alt = "", size = 36, className = "", onClick }: AvatarProps) {
  return (
    <img
      src={src && src.trim() ? src : defaultAvatar}
      alt={alt}
      onClick={onClick}
      className={`avatar-img ${className}`}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
    />
  )
}

export default Avatar
