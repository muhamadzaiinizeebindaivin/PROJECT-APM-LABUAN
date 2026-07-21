// src/screens/latihan/LatihanBreakdownModals.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X, Users, TrendingUp, GraduationCap, Plus, Edit, Trash2 } from 'lucide-react-native';
import HoverTip from '../../components/HoverTip';
import { PALETTE } from '../../constants/palette';
import { statusMeta, formatDisplayDate } from './latihanConstants';
import { appStyles as shared } from '../../styles/appStyles';
import { latihanStyles as styles } from './latihanStyles';

// Coquille commune des pop-ups Latihan : header avec pastille d'icône,
// sous-titre, pill de compteur et croix de fermeture.
function ModalShell({ visible, onClose, Icon, iconColor, title, subtitle, countLabel, wide, children }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={shared.modalOverlay}>
        <View style={[shared.modalContainer, { maxHeight: '80%' }, wide && styles.popWide]}>
          <View style={styles.popHeader}>
            <View style={[styles.popIconBadge, { backgroundColor: iconColor + '1F' }]}>
              <Icon size={18} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={shared.modalTitle}>{title}</Text>
              {subtitle ? <Text style={styles.popSub}>{subtitle}</Text> : null}
            </View>
            {countLabel ? (
              <View style={[styles.popCountPill, { backgroundColor: iconColor + '1F' }]}>
                <Text style={[styles.popCountText, { color: iconColor }]}>{countLabel}</Text>
              </View>
            ) : null}
            <TouchableOpacity onPress={onClose} style={styles.popCloseBtn}>
              <X size={20} color={PALETTE.textMutedDark} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function SenaraiModal({ visible, onClose, latihanList, isEditMode, onAdd, onEdit, onDelete }) {
  return (
    <ModalShell
      visible={visible} onClose={onClose} wide
      Icon={GraduationCap} iconColor={PALETTE.orange}
      title="Senarai Latihan" subtitle="Semua latihan mengikut tarikh"
      countLabel={`${latihanList.length} latihan`}
    >
      {isEditMode ? (
        <View style={styles.popToolbar}>
          <TouchableOpacity style={shared.addButton} onPress={onAdd}>
            <Plus size={16} color="#fff" />
            <Text style={shared.addButtonText}>Tambah</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={shared.modalForm} showsVerticalScrollIndicator={false}>
        {latihanList.map((item) => {
          const meta = statusMeta(item.status);
          return (
            <View key={item.id} style={styles.listItem}>
              <View style={styles.dateChip}>
                <Text style={styles.dateText}>{formatDisplayDate(item.start_date, item.end_date)}</Text>
              </View>
              <View style={{ flex: 1, paddingLeft: 8 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>{item.note || 'Tiada Kumpulan'} • {item.pax} Pax</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.statusBadge, { backgroundColor: meta.soft }]}>
                  <meta.Icon size={12} color={meta.color} />
                  <Text style={[styles.statusBadgeText, { color: meta.color }]}>{item.status}</Text>
                </View>
                {isEditMode ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <HoverTip label="Kemaskini latihan ini">
                      <TouchableOpacity onPress={() => onEdit(item)} style={[styles.itemActionBtn, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
                        <Edit size={14} color={PALETTE.orange} />
                      </TouchableOpacity>
                    </HoverTip>
                    <HoverTip label="Padam latihan ini">
                      <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.itemActionBtn, { backgroundColor: 'rgba(220, 38, 38, 0.10)' }]}>
                        <Trash2 size={14} color={PALETTE.danger} />
                      </TouchableOpacity>
                    </HoverTip>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
        {latihanList.length === 0 ? <Text style={shared.emptyText}>Tiada data latihan.</Text> : null}
      </ScrollView>
    </ModalShell>
  );
}

export function PesertaModal({ visible, onClose, latihanList, totalPax }) {
  return (
    <ModalShell
      visible={visible} onClose={onClose}
      Icon={Users} iconColor={PALETTE.blue}
      title="Pecahan Peserta" subtitle="Bilangan peserta setiap latihan"
      countLabel={`${totalPax} Pax`}
    >
      <ScrollView contentContainerStyle={shared.modalForm} showsVerticalScrollIndicator={false}>
        {latihanList.map((item) => (
          <View key={item.id} style={styles.listItem}>
            <Text style={styles.breakdownTitle}>{item.title}</Text>
            <Text style={styles.breakdownPax}>{item.pax} Pax</Text>
          </View>
        ))}
        <View style={styles.breakdownTotalRow}>
          <Text style={styles.breakdownTotalLabel}>Jumlah Keseluruhan</Text>
          <Text style={styles.breakdownTotalValue}>{totalPax} Pax</Text>
        </View>
      </ScrollView>
    </ModalShell>
  );
}

export function PrestasiModal({ visible, onClose, latihanList, completionRate }) {
  return (
    <ModalShell
      visible={visible} onClose={onClose}
      Icon={TrendingUp} iconColor={PALETTE.orange}
      title="Status Keseluruhan" subtitle="Status setiap latihan"
      countLabel={completionRate !== undefined ? `${completionRate}% Berjaya` : null}
    >
      <ScrollView contentContainerStyle={shared.modalForm} showsVerticalScrollIndicator={false}>
        {latihanList.map((item) => {
          const meta = statusMeta(item.status);
          return (
            <View key={item.id} style={styles.listItem}>
              <Text style={styles.breakdownTitle}>{item.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: meta.soft }]}>
                <meta.Icon size={12} color={meta.color} />
                <Text style={[styles.statusBadgeText, { color: meta.color }]}>{item.status}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ModalShell>
  );
}