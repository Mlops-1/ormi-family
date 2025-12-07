import React from 'react';

type ColorToken = {
  label: string;
  token: string;
  className: string;
  hex: string;
  usage: string;
};

const lightColors: ColorToken[] = [
  {
    label: 'Primary',
    token: 'jeju-light-primary',
    className: 'bg-jeju-light-primary',
    hex: '#FF8A00',
    usage: '대표 액션 버튼, 주요 하이라이트',
  },
  {
    label: 'Primary Variant',
    token: 'jeju-light-primary-variant',
    className: 'bg-jeju-light-primary-variant',
    hex: '#FF6A00',
    usage: '버튼 Press/Active 상태, 보조 포인트',
  },
  {
    label: 'Secondary',
    token: 'jeju-light-secondary',
    className: 'bg-jeju-light-secondary',
    hex: '#4CAF50',
    usage: '세컨더리 액션, 탭 강조',
  },
  {
    label: 'Secondary Variant',
    token: 'jeju-light-secondary-variant',
    className: 'bg-jeju-light-secondary-variant',
    hex: '#6CCF70',
    usage: '보조 강조, 배지',
  },
  {
    label: 'Background',
    token: 'jeju-light-background',
    className: 'bg-jeju-light-background',
    hex: '#FFFDF9',
    usage: '앱 전체 배경',
  },
  {
    label: 'Surface',
    token: 'jeju-light-surface',
    className: 'bg-jeju-light-surface',
    hex: '#FFFFFF',
    usage: '카드, 모달, 바텀시트',
  },
  {
    label: 'Divider',
    token: 'jeju-light-divider',
    className: 'bg-jeju-light-divider',
    hex: '#E5E5E5',
    usage: '구분선, 테두리',
  },
  {
    label: 'Text Primary',
    token: 'jeju-light-text-primary',
    className: 'bg-jeju-light-text-primary',
    hex: '#1A1A1A',
    usage: '본문, 제목 텍스트',
  },
  {
    label: 'Text Secondary',
    token: 'jeju-light-text-secondary',
    className: 'bg-jeju-light-text-secondary',
    hex: '#555555',
    usage: '보조 텍스트, 설명',
  },
  {
    label: 'Text Disabled',
    token: 'jeju-light-text-disabled',
    className: 'bg-jeju-light-text-disabled',
    hex: '#9E9E9E',
    usage: '비활성 텍스트',
  },
  {
    label: 'Error',
    token: 'jeju-light-error',
    className: 'bg-jeju-light-error',
    hex: '#E53935',
    usage: '에러, 경고 상태',
  },
  {
    label: 'Success',
    token: 'jeju-light-success',
    className: 'bg-jeju-light-success',
    hex: '#43A047',
    usage: '성공 상태',
  },
  {
    label: 'Info',
    token: 'jeju-light-info',
    className: 'bg-jeju-light-info',
    hex: '#0288D1',
    usage: '정보성 배지, 알림',
  },
];

const darkColors: ColorToken[] = [
  {
    label: 'Primary',
    token: 'jeju-dark-primary',
    className: 'bg-jeju-dark-primary',
    hex: '#FF9100',
    usage: '대표 액션 버튼, 주요 하이라이트',
  },
  {
    label: 'Primary Variant',
    token: 'jeju-dark-primary-variant',
    className: 'bg-jeju-dark-primary-variant',
    hex: '#FF7800',
    usage: '버튼 Press/Active 상태, 보조 포인트',
  },
  {
    label: 'Secondary',
    token: 'jeju-dark-secondary',
    className: 'bg-jeju-dark-secondary',
    hex: '#66BB6A',
    usage: '세컨더리 액션, 탭 강조',
  },
  {
    label: 'Secondary Variant',
    token: 'jeju-dark-secondary-variant',
    className: 'bg-jeju-dark-secondary-variant',
    hex: '#8EE58F',
    usage: '보조 강조, 배지',
  },
  {
    label: 'Background',
    token: 'jeju-dark-background',
    className: 'bg-jeju-dark-background',
    hex: '#121212',
    usage: '앱 전체 배경',
  },
  {
    label: 'Surface',
    token: 'jeju-dark-surface',
    className: 'bg-jeju-dark-surface',
    hex: '#1E1E1E',
    usage: '카드, 모달, 바텀시트',
  },
  {
    label: 'Elevated Surface',
    token: 'jeju-dark-elevated-surface',
    className: 'bg-jeju-dark-elevated-surface',
    hex: '#2A2A2A',
    usage: '떠 있는 카드, FAB 주변',
  },
  {
    label: 'Divider',
    token: 'jeju-dark-divider',
    className: 'bg-jeju-dark-divider',
    hex: '#333333',
    usage: '구분선, 테두리',
  },
  {
    label: 'Text Primary',
    token: 'jeju-dark-text-primary',
    className: 'bg-jeju-dark-text-primary',
    hex: '#FFFFFF',
    usage: '본문, 제목 텍스트',
  },
  {
    label: 'Text Secondary',
    token: 'jeju-dark-text-secondary',
    className: 'bg-jeju-dark-text-secondary',
    hex: '#CCCCCC',
    usage: '보조 텍스트, 설명',
  },
  {
    label: 'Text Disabled',
    token: 'jeju-dark-text-disabled',
    className: 'bg-jeju-dark-text-disabled',
    hex: '#777777',
    usage: '비활성 텍스트',
  },
  {
    label: 'Error',
    token: 'jeju-dark-error',
    className: 'bg-jeju-dark-error',
    hex: '#EF5350',
    usage: '에러, 경고 상태',
  },
  {
    label: 'Success',
    token: 'jeju-dark-success',
    className: 'bg-jeju-dark-success',
    hex: '#66BB6A',
    usage: '성공 상태',
  },
  {
    label: 'Info',
    token: 'jeju-dark-info',
    className: 'bg-jeju-dark-info',
    hex: '#29B6F6',
    usage: '정보성 배지, 알림',
  },
];

const Section: React.FC<{
  title: string;
  colors: ColorToken[];
  dark?: boolean;
}> = ({ title, colors, dark }) => {
  return (
    <section
      className={
        dark
          ? 'bg-neutral-900 text-neutral-50 p-6 rounded-2xl'
          : 'bg-neutral-50 text-neutral-900 p-6 rounded-2xl'
      }
    >
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colors.map((color) => (
          <div
            key={color.token}
            className={
              'flex flex-col gap-2 rounded-xl border p-3 ' +
              (dark
                ? 'border-neutral-700 bg-neutral-900/60'
                : 'border-neutral-200 bg-white')
            }
          >
            <div
              className={
                'h-12 w-full rounded-md border ' +
                (dark ? 'border-neutral-700' : 'border-neutral-200') +
                ' ' +
                color.className
              }
            />
            <div className="text-sm font-medium">{color.label}</div>
            <div className="text-xs font-mono">
              token: <span className="font-semibold">{color.token}</span>
            </div>
            <div className="text-xs font-mono">hex: {color.hex}</div>
            <div className="text-xs text-neutral-500">{color.usage}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const JejuPalettePreview: React.FC = () => {
  return (
    <div className="flex flex-col gap-8">
      <Section title="Jeju Tangerine – Light Theme" colors={lightColors} />
      <Section title="Jeju Tangerine – Dark Theme" colors={darkColors} dark />
    </div>
  );
};
