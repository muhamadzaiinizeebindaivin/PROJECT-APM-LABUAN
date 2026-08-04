import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, ExternalLink, Pencil, Trash2 } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { CERT_CATEGORIES } from './certificateCategories';

export default function CertificatesTab({ certificates, isEditing, onAdd, onEdit, onOpenLink, onDelete }) {
  return (
    <View>
      {isEditing && (
        <View style={[styles.cardHeader, { justifyContent: 'flex-end' }]}>
          <TouchableOpacity onPress={onAdd} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Plus size={20} color={PALETTE.orange} />
            <Text style={{ color: PALETTE.orange, fontWeight: '700', fontSize: 13 }}>Tambah Sijil</Text>
          </TouchableOpacity>
        </View>
      )}

      {CERT_CATEGORIES.map((cat) => {
        const certsInCat = certificates.filter((c) => (c.kategori || 'Lain-lain') === cat);
        return (
          <View key={cat} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              {cat}
            </Text>
            {certsInCat.length === 0 ? (
              <Text style={{ color: PALETTE.textMutedDark, fontSize: 13, fontStyle: 'italic' }}>Tiada sijil direkodkan.</Text>
            ) : (
              certsInCat.map((cert) => (
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
      })}
    </View>
  );
}