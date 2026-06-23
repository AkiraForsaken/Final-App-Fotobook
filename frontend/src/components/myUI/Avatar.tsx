interface AvatarProps {
  src?: string;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-md",
  lg: "h-12 w-12 text-lg",
};

export const Avatar = ({ src, firstName, lastName, size = "md", className = "" }: AvatarProps) => {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={`rounded-full object-cover ring-2 ring-white/50 ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center ring-2 ring-white/50 ${sizeClasses[size]} ${className}`}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
};
