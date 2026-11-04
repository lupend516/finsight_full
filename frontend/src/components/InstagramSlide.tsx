import React from 'react';

interface InstagramSlideProps {
  slide: {
    id: number;
    title: string;
    subtitle: string;
    content: string;
    backgroundColor: string;
    textColor: string;
    backgroundImage?: string;
  };
  isActive: boolean;
  onEdit: (field: string, value: string) => void;
}

export function InstagramSlide({ slide, isActive, onEdit }: InstagramSlideProps) {
  return (
    <div className="relative w-full h-full">
      {/* Instagram Post Container - 1080x1080 aspect ratio */}
      <div 
        className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl"
        style={{
          backgroundColor: slide.backgroundColor,
          backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          {/* Slide Number */}
          <div className="absolute top-6 right-6">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: slide.textColor,
                opacity: 0.2
              }}
            />
            <div 
              className="absolute inset-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ color: slide.textColor }}
            >
              {slide.id}
            </div>
          </div>

          {/* Editable Content */}
          <div className="flex flex-col items-center justify-center gap-6 w-full max-w-lg">
            {isActive ? (
              <>
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => onEdit('title', e.target.value)}
                  className="w-full text-center bg-transparent border-2 border-dashed border-white/30 rounded-lg px-4 py-2"
                  style={{ color: slide.textColor }}
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={slide.subtitle}
                  onChange={(e) => onEdit('subtitle', e.target.value)}
                  className="w-full text-center bg-transparent border-2 border-dashed border-white/30 rounded-lg px-4 py-2"
                  style={{ color: slide.textColor }}
                  placeholder="Subtitle"
                />
                <textarea
                  value={slide.content}
                  onChange={(e) => onEdit('content', e.target.value)}
                  className="w-full text-center bg-transparent border-2 border-dashed border-white/30 rounded-lg px-4 py-3 min-h-[120px] resize-none"
                  style={{ color: slide.textColor }}
                  placeholder="Content"
                />
              </>
            ) : (
              <>
                <h1 style={{ color: slide.textColor }}>
                  {slide.title}
                </h1>
                <h2 style={{ color: slide.textColor, opacity: 0.9 }}>
                  {slide.subtitle}
                </h2>
                <p 
                  className="text-center max-w-md"
                  style={{ color: slide.textColor, opacity: 0.85 }}
                >
                  {slide.content}
                </p>
              </>
            )}
          </div>

          {/* Branding Footer */}
          <div 
            className="absolute bottom-6 left-0 right-0 flex justify-center"
            style={{ color: slide.textColor, opacity: 0.7 }}
          >
            <span>@yourhandle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
