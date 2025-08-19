interface RoundedButtonProps {
  onClick: () => void;
  title: string;
  className?: string;
}

export const RoundedButton: React.FC<RoundedButtonProps> = ({
  onClick,
  title,
  className,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`m-4 max-w-xs p-6 text-left text-inherit hover:text-blue-600 focus:border-blue-600 focus:text-blue-600 active:border-blue-600 active:text-blue-600cursor-pointer rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 ${className}`}
  >
    {title}
  </button>
);
