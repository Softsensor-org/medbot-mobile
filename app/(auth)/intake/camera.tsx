import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '../../../src/theme';
import { useCameraQuality } from '../../../src/hooks/useCameraQuality';
import { useUploadPhoto } from '../../../src/hooks/useEvidence';

export default function CameraCaptureScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const quality = useCameraQuality();
  const cameraRef = useRef<CameraView>(null);
  const uploadMutation = useUploadPhoto();

  const [isCapturing, setIsCapturing] = useState(false);
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);

  useEffect(() => {
    if (quality.isLevel && quality.isStable && !photo) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [quality.isLevel, quality.isStable, photo]);

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        const p = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          exif: true,
        });
        setPhoto(p);
      } catch (e) {
        console.error("Capture error", e);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const savePhoto = async () => {
    if (!photo || !sessionId) return;
    
    try {
      // expo-camera base64 doesn't include data: prefix
      const base64Data = photo.base64?.startsWith('data:') 
        ? photo.base64 
        : `data:image/jpeg;base64,${photo.base64}`;

      await uploadMutation.mutateAsync({
        sessionId,
        base64: base64Data
      });
      
      router.back();
    } catch {
      Alert.alert("Upload Failed", "We couldn't save your photo. Please try again.");
    }
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        <View style={styles.previewActions}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => setPhoto(null)}
            disabled={uploadMutation.isPending}
          >
            <MaterialIcons name="refresh" size={32} color={colors.surface} />
            <Text style={styles.actionText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.confirmBtn]} 
            onPress={savePhoto}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <MaterialIcons name="check" size={32} color={colors.surface} />
                <Text style={styles.actionText}>Use Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        ref={cameraRef}
        facing="back"
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <MaterialIcons name="close" size={28} color={colors.surface} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Capture Progress</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.guideContainer}>
            <View style={[
                styles.bullseye, 
                quality.isLevel && styles.bullseyeLevel,
                quality.isStable && styles.bullseyeStable
            ]}>
                <View style={styles.levelLineH} />
                <View style={styles.levelLineV} />
            </View>
            <Text style={[
                styles.feedbackText,
                quality.isLevel && quality.isStable && styles.feedbackSuccess
            ]}>
                {quality.feedback}
            </Text>
          </View>

          <View style={styles.controls}>
            <View style={styles.shutterContainer}>
              <TouchableOpacity 
                style={[
                    styles.shutter,
                    (!quality.isLevel || !quality.isStable) && styles.shutterDisabled
                ]} 
                onPress={takePicture}
                disabled={isCapturing}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.textPrimary,
  },
  btn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  btnText: {
    ...typography.button,
    color: colors.surface,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.surface,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  guideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bullseye: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bullseyeLevel: {
    borderColor: colors.amber,
    borderWidth: 3,
  },
  bullseyeStable: {
    borderColor: colors.success,
    borderWidth: 4,
  },
  levelLineH: {
    position: 'absolute',
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  levelLineV: {
    position: 'absolute',
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  feedbackText: {
    ...typography.bodySmall,
    color: colors.surface,
    marginTop: spacing.md,
    fontWeight: '700',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  feedbackSuccess: {
    color: colors.success,
  },
  controls: {
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  shutterContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    padding: 4,
  },
  shutterInner: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#000',
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  actionBtn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  }
});
