import React from 'react';

interface HighlightTextProps {
  text: string;
  search?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, search }) => {
  if (!search) return <span>{text}</span>;
  
  const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedSearch})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={index} style={{ backgroundColor: '#fef08a', color: '#1e3a8a', padding: '0 2px', borderRadius: '2px' }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};
export default HighlightText;
