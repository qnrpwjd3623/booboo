import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Heart } from 'lucide-react';
import { Modal } from './Modal';

interface CoupleProfileProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CoupleProfile;
  onSave: (profile: CoupleProfile) => void;
}

export interface CoupleProfile {
  partner1: {
    name: string;
    avatar: string;
    emoji: string;
  };
  partner2: {
    name: string;
    avatar: string;
    emoji: string;
  };
  coupleName: string;
}

const avatarOptions = [
  { emoji: '👨', label: '남성' },
  { emoji: '👩', label: '여성' },
  { emoji: '🧑', label: '중성' },
  { emoji: '👨‍💼', label: '직장인' },
  { emoji: '👩‍💼', label: '직장인' },
  { emoji: '🦸', label: '히어로' },
  { emoji: '🦹', label: '히어로' },
  { emoji: '🧙', label: '마법사' },
  { emoji: '🧝', label: '엘프' },
  { emoji: '🤖', label: '로봇' },
  { emoji: '👻', label: '귀신' },
  { emoji: '🐱', label: '고양이' },
  { emoji: '🐶', label: '강아지' },
  { emoji: '🐻', label: '곰' },
  { emoji: '🐰', label: '토끼' },
  { emoji: '🦊', label: '여우' },
];

export function CoupleProfileSettings({ isOpen, onClose, profile, onSave }: CoupleProfileProps) {
  const [editedProfile, setEditedProfile] = useState(profile);
  const [editingPartner, setEditingPartner] = useState<1 | 2 | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave(editedProfile);
    onClose();
  };

  const handleImageUpload = (partner: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (partner === 1) {
          setEditedProfile(prev => ({ ...prev, partner1: { ...prev.partner1, avatar: base64 } }));
        } else {
          setEditedProfile(prev => ({ ...prev, partner2: { ...prev.partner2, avatar: base64 } }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="부부 프로필 설정" maxWidth="max-w-lg">
      <div className="p-6 space-y-6">
        {/* Couple Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">커플명</label>
          <div className="relative">
            <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
            <input
              type="text"
              value={editedProfile.coupleName}
              onChange={(e) => setEditedProfile(prev => ({ ...prev, coupleName: e.target.value }))}
              placeholder="우리 가계부"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Partners */}
        <div className="grid grid-cols-2 gap-4">
          {/* Partner 1 */}
          <div className="p-4 bg-gray-50 rounded-2xl">
            <p className="text-sm font-medium text-gray-500 mb-3">파트너 1</p>
            
            {/* Avatar */}
            <div className="flex justify-center mb-3">
              <div className="relative">
                {editedProfile.partner1.avatar ? (
                  <img
                    src={editedProfile.partner1.avatar}
                    alt="Partner 1"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-4xl border-4 border-white shadow-lg">
                    {editedProfile.partner1.emoji}
                  </div>
                )}
                <button
                  onClick={() => setEditingPartner(1)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Name */}
            <input
              type="text"
              value={editedProfile.partner1.name}
              onChange={(e) => setEditedProfile(prev => ({ 
                ...prev, 
                partner1: { ...prev.partner1, name: e.target.value } 
              }))}
              placeholder="이름"
              className="w-full px-3 py-2 bg-white rounded-lg text-center text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            {/* Emoji Selector */}
            {editingPartner === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-white rounded-xl"
              >
                <p className="text-xs text-gray-500 mb-2">캐릭터 선택</p>
                <div className="grid grid-cols-4 gap-2">
                  {avatarOptions.map((opt) => (
                    <button
                      key={opt.emoji}
                      onClick={() => {
                        setEditedProfile(prev => ({ 
                          ...prev, 
                          partner1: { ...prev.partner1, emoji: opt.emoji, avatar: '' } 
                        }));
                        setEditingPartner(null);
                      }}
                      className={`p-2 rounded-lg text-2xl hover:bg-gray-100 transition-colors ${
                        editedProfile.partner1.emoji === opt.emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                      }`}
                      title={opt.label}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(1, e)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-full py-2 text-xs text-blue-500 hover:text-blue-600 flex items-center justify-center gap-1"
                >
                  <Camera className="w-3 h-3" />
                  사진 업로드
                </button>
              </motion.div>
            )}
          </div>

          {/* Partner 2 */}
          <div className="p-4 bg-gray-50 rounded-2xl">
            <p className="text-sm font-medium text-gray-500 mb-3">파트너 2</p>
            
            {/* Avatar */}
            <div className="flex justify-center mb-3">
              <div className="relative">
                {editedProfile.partner2.avatar ? (
                  <img
                    src={editedProfile.partner2.avatar}
                    alt="Partner 2"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-4xl border-4 border-white shadow-lg">
                    {editedProfile.partner2.emoji}
                  </div>
                )}
                <button
                  onClick={() => setEditingPartner(2)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Name */}
            <input
              type="text"
              value={editedProfile.partner2.name}
              onChange={(e) => setEditedProfile(prev => ({ 
                ...prev, 
                partner2: { ...prev.partner2, name: e.target.value } 
              }))}
              placeholder="이름"
              className="w-full px-3 py-2 bg-white rounded-lg text-center text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />

            {/* Emoji Selector */}
            {editingPartner === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-white rounded-xl"
              >
                <p className="text-xs text-gray-500 mb-2">캐릭터 선택</p>
                <div className="grid grid-cols-4 gap-2">
                  {avatarOptions.map((opt) => (
                    <button
                      key={opt.emoji}
                      onClick={() => {
                        setEditedProfile(prev => ({ 
                          ...prev, 
                          partner2: { ...prev.partner2, emoji: opt.emoji, avatar: '' } 
                        }));
                        setEditingPartner(null);
                      }}
                      className={`p-2 rounded-lg text-2xl hover:bg-gray-100 transition-colors ${
                        editedProfile.partner2.emoji === opt.emoji ? 'bg-pink-100 ring-2 ring-pink-500' : ''
                      }`}
                      title={opt.label}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(2, e)}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleImageUpload(2, e as unknown as React.ChangeEvent<HTMLInputElement>);
                    input.click();
                  }}
                  className="mt-2 w-full py-2 text-xs text-pink-500 hover:text-pink-600 flex items-center justify-center gap-1"
                >
                  <Camera className="w-3 h-3" />
                  사진 업로드
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-pink-50 rounded-2xl">
          <p className="text-xs text-gray-500 mb-2">미리보기</p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-3xl mb-1">
                {editedProfile.partner1.avatar ? (
                  <img src={editedProfile.partner1.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                ) : (
                  editedProfile.partner1.emoji
                )}
              </div>
              <p className="text-sm font-medium text-gray-700">{editedProfile.partner1.name || '파트너 1'}</p>
            </div>
            <Heart className="w-6 h-6 text-pink-400 fill-pink-400" />
            <div className="text-center">
              <div className="text-3xl mb-1">
                {editedProfile.partner2.avatar ? (
                  <img src={editedProfile.partner2.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                ) : (
                  editedProfile.partner2.emoji
                )}
              </div>
              <p className="text-sm font-medium text-gray-700">{editedProfile.partner2.name || '파트너 2'}</p>
            </div>
          </div>
          <p className="text-center text-sm font-medium text-gray-600 mt-2">
            {editedProfile.coupleName || '우리 가계부'}
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl transition-all shadow-lg"
        >
          저장하기
        </button>
      </div>
    </Modal>
  );
}
