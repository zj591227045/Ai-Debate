import React from 'react';
import { CharacterConfig } from '../../types';

interface BasicInfoProps {
  data: Partial<CharacterConfig>;
  onChange: (data: Partial<CharacterConfig>) => void;
}

export default function BasicInfo({ data, onChange }: BasicInfoProps) {
  const handleChange = (field: keyof Pick<CharacterConfig, 'name' | 'description'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange({
      ...data,
      [field]: e.target.value,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({
          ...data,
          avatar: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="basic-info">
      <div className="form-group">
        <label htmlFor="name">角色名称</label>
        <input
          type="text"
          id="name"
          value={data.name || ''}
          onChange={handleChange('name')}
          placeholder="请输入角色名称"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="avatar">角色头像</label>
        <div className="avatar-upload">
          {data.avatar && (
            <div className="avatar-preview">
              <img src={data.avatar} alt="角色头像" />
            </div>
          )}
          <input
            type="file"
            id="avatar"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">角色简介</label>
        <textarea
          id="description"
          value={data.description || ''}
          onChange={handleChange('description')}
          placeholder="请输入角色简介"
          rows={4}
        />
      </div>
    </div>
  );
} 