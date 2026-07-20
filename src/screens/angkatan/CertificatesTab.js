import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, ExternalLink, Pencil, Trash2 } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function CertificatesTab({ certificates, isEditing, onAdd, onEdit, onOpenLink, onDelete }) {
  return (
    <View>
      <View style={styles.cardHeader}>
        <Text style={{ color: PALETTE.textDark, fontWeight: '700', fontSize: 14 }}>Sijil / Sertifikat</Text>
        {isEditing && (
          <TouchableOpacity onPress={onAdd}>
            <Plus size={20} color={PALETTE.orange} />
          </TouchableOpacity>
        )}
      </View>

      {certificates.length === 0 ? (
        <Text style={{ color: PALETTE.textMutedDark, fontSize: 13, fontStyle: 'italic' }}>Tiada sijil direkodkan.</Text>
      ) : (
        certificates.map((cert) => (
          <View key={cert.id} style={styles.certRow}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => onOpenLink(cert.google_drive_link)}>
              <ExternalLink size={16} color={PALETTE.orange} />
              <Text style={[styles.certName, { marginLeft: 10 }]}>{cert.nom_certificat}</Text>
            </TouchableOpacity>
            {isEditing && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => onEdit(cert)}>
                  <Pencil size={16} color={PALETTE.orange} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(cert.id)}>
                  <Trash2 size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
}