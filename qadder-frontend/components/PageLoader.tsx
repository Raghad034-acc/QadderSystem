type PageLoaderProps = {
  text?: string;
};

export default function PageLoader({ text = "جاري التحميل..." }: PageLoaderProps) {
  return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center justify-center gap-x-2">
          <div className="h-5 w-5 rounded-full bg-qadder-primary animate-bounce"></div>
          <div className="h-5 w-5 rounded-full bg-qadder-secondary animate-bounce [animation-delay:0.2s]"></div>
          <div className="h-5 w-5 rounded-full bg-qadder-accent animate-bounce [animation-delay:0.4s]"></div>
        </div>

        <p className="font-medium text-qadder-dark/60">{text}</p>
      </div>
  );
}