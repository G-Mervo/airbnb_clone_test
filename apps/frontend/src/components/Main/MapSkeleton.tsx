const MapSkeleton = () => {
  return (
    <div
      className="relative rounded-xl overflow-hidden h-[calc(100vh-140px)] animate-shimmer flex items-center justify-center"
      style={{ backgroundColor: '#e5e3df' }}
    >
      {/* Three dots loading indicator */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
          style={{ animationDelay: '0.2s' }}
        ></div>
      </div>
    </div>
  );
};

export default MapSkeleton;
