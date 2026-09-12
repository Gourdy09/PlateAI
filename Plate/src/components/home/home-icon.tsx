import { useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { HomeAssets } from '@/components/home/home-assets';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type HomeAssetName = keyof typeof HomeAssets.light;

const SIZES: Record<HomeAssetName, { width: number; height: number }> = {
  bell: { width: 20, height: 20 },
  sliders: { width: 16, height: 16 },
  chevron_down: { width: 14, height: 14 },
  heart: { width: 20, height: 20 },
  arrow_left: { width: 14, height: 14 },
  arrow_right: { width: 14, height: 14 },
  camera: { width: 26, height: 26 },
  cart: { width: 22, height: 22 },
  home: { width: 22, height: 22 },
  user: { width: 22, height: 22 },
};

export function HomeIcon({
  name,
  width,
  height,
  style,
  color,
  filled,
}: {
  name: HomeAssetName;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
  filled?: boolean;
}) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';
  const size = SIZES[name];
  const w = width ?? size.width;
  const h = height ?? size.height;
  const uid = useId().replace(/:/g, '');
  let xml = HomeAssets[theme][name].replace(/clip0_[0-9_]+/g, `clip_${name}_${uid}`);
  if (color) {
    xml = xml.replace(/stroke="[^"]+"/g, `stroke="${color}"`);
  }
  if (filled) {
    xml = xml.replace('fill="none"', `fill="${color ?? '#E85D3F'}"`);
  }

  return (
    <View style={[{ width: w, height: h }, style]}>
      <SvgXml xml={xml} width={w} height={h} />
    </View>
  );
}
