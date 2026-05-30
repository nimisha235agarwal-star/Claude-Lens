'use client';

import { useState, useCallback } from 'react';
import styles from './ConversationHeader.module.css';

interface ConversationHeaderProps {
  title: string;
  tags: string[];
  highStakesMode: boolean;
  onNewChat: () => void;
  onTitleChange: (title: string) => void;
  onToggleHighStakes: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function ConversationHeader({
  title,
  tags,
  highStakesMode,
  onNewChat,
  onTitleChange,
  onToggleHighStakes,
  onAddTag,
  onRemoveTag,
}: ConversationHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [addingTag, setAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const commitTitle = useCallback(() => {
    onTitleChange(editValue.trim() || title);
    setEditing(false);
  }, [editValue, onTitleChange, title]);

  const commitTag = useCallback(() => {
    if (tagInput.trim()) onAddTag(tagInput);
    setTagInput('');
    setAddingTag(false);
  }, [onAddTag, tagInput]);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button type="button" className={styles.newBtn} onClick={onNewChat}>
          <SparkleIcon />
          <span>New</span>
        </button>
      </div>

      <div className={styles.center}>
        {editing ? (
          <input
            className={styles.titleInput}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') {
                setEditValue(title);
                setEditing(false);
              }
            }}
            autoFocus
            aria-label="Conversation title"
          />
        ) : (
          <button
            type="button"
            className={styles.titleBtn}
            onClick={() => {
              setEditValue(title);
              setEditing(true);
            }}
            title="Click to edit title"
          >
            {title}
          </button>
        )}

        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
              <button
                type="button"
                className={styles.tagRemove}
                onClick={() => onRemoveTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          {addingTag ? (
            <input
              className={styles.tagInput}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onBlur={commitTag}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTag();
                if (e.key === 'Escape') {
                  setTagInput('');
                  setAddingTag(false);
                }
              }}
              placeholder="tag name"
              autoFocus
              aria-label="New tag"
            />
          ) : (
            <button
              type="button"
              className={styles.addTag}
              onClick={() => setAddingTag(true)}
            >
              + Tag
            </button>
          )}
        </div>
      </div>

      <div className={styles.right}>
        <span className={styles.hsLabel}>
          <ShieldIcon />
          High-Stakes Mode
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={highStakesMode}
          aria-label="Toggle High-Stakes Mode"
          className={`${styles.toggle} ${highStakesMode ? styles.toggleOn : ''}`}
          onClick={onToggleHighStakes}
        >
          <span className={styles.toggleThumb} />
        </button>
      </div>
    </header>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
