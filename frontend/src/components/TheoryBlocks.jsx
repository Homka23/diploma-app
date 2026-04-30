import StaffExample  from './StaffExample';
import PianoKeyboard from './PianoKeyboard';

function TheoryContent({ content }) {
  if (!content?.blocks) return null;
  return (
    <div className="space-y-5">
      {content.blocks.map((block, i) => {
        if (block.type === 'heading')
          return <h2 key={i} className="mt-2 text-[1.35rem] font-semibold text-dark">{block.text}</h2>;
        if (block.type === 'paragraph')
          return <p key={i} className="text-[15px] leading-loose text-dark/70">{block.text}</p>;
        if (block.type === 'list') {
          const isGrid = block.items?.length > 0 && typeof block.items[0] === 'object';
          return (
            <div key={i}>
              {block.label && (
                <p className="mb-5 text-[14px] font-semibold uppercase tracking-widest text-[#285A48]/70">{block.label}</p>
              )}
              {isGrid ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {block.items.map((item, j) => (
                    <div key={j} className="flex flex-col items-center rounded-lg border border-primary/10 bg-white px-2 py-3">
                      <span className="text-base font-bold text-dark">{item.value ?? item.note ?? item.name}</span>
                      {(item.label ?? item.solfege) && (
                        <span className="mt-0.5 text-xs text-dark/40">{item.label ?? item.solfege}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-[15px] text-dark/70">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/40" />
                      {typeof item === 'string' ? item : (item.value ?? item.name)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        }
        if (block.type === 'note')
          return (
            <div key={i} className="flex gap-3 rounded-r-lg border-l-4 border-[#408A71] bg-[#408A71]/8 px-4 py-3">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#408A71] text-[10px] font-bold text-white">i</div>
              <p className="text-[15px] text-dark/70">{block.text}</p>
            </div>
          );
        return null;
      })}
    </div>
  );
}

export function BlockCard({ block }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white px-6 py-5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
      {block.title && (
        <p className="mb-6 text-[13px] font-semibold uppercase tracking-widest text-[#285A48]/70">{block.title}</p>
      )}
      {block.type === 'theory' && <TheoryContent content={block.content} />}
      {block.type === 'staff_example' && (
        <div className="space-y-3">
          <StaffExample content={block.content} />
          {block.description && <p className="text-center text-xs text-primary/40">{block.description}</p>}
        </div>
      )}
      {block.type === 'piano_example' && (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <PianoKeyboard notes={block.content?.notes ?? []} />
          </div>
          {(block.content?.label || block.description) && (
            <p className="text-center text-xs text-primary/40">{block.content?.label || block.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
