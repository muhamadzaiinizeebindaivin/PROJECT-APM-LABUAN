// src/screens/LatihanScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Users, Calendar, Plus, Edit, Trash2, TrendingUp, GraduationCap, BarChart3 } from 'lucide-react-native';
import { useLatihan } from '../hooks/useLatihan';
import AdminEditButton from '../components/AdminEditButton';
import HoverTip from '../components/HoverTip';
import { PALETTE } from '../constants/palette';
import { statusMeta, formatDisplayDate } from './latihan/latihanConstants';
import { sharedStyles as shared } from './sekretariat/sekretariatStyles';
import { latihanStyles as styles } from './latihan/latihanStyles';
import { AnimatedVerticalBar, AnimatedHorizontalBar, StatusDonut } from './latihan/LatihanCharts';
import LatihanFormModal from './latihan/LatihanFormModal';
import { PesertaModal, PrestasiModal } from './latihan/LatihanBreakdownModals';

export default function LatihanScreen({ theme, userRole }) {
  const { latihanList, isLoading, stats, saveLatihan, deleteLatihan } = useLatihan();

  const [showList, setShowList] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(null);

  const [isFormModalVisible, setFormModalVisible] = useState(false);
  const [pesertaModalVisible, setPesertaModalVisible] = useState(false);
  const [prestasiModalVisible, setPrestasiModalVisible] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', start_date: new Date(), end_date: new Date(), pax: '', status: 'Akan Diadakan', sasaran: [],
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ title: '', start_date: new Date(), end_date: new Date(), pax: '', status: 'Akan Diadakan', sasaran: [] });
    setFormModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    const parsedSasaran = item.note ? item.note.split(',').map(s => s.trim()).filter(s => s) : [];
    setFormData({
      title: item.title,
      start_date: item.start_date ? new Date(item.start_date) : new Date(),
      end_date: item.end_date ? new Date(item.end_date) : new Date(),
      pax: item.pax ? item.pax.toString() : '',
      status: item.status || 'Akan Diadakan',
      sasaran: parsedSasaran,
    });
    setFormModalVisible(true);
  };

  const handleSave = async () => {
    const ok = await saveLatihan(formData, editingId);
    if (ok) setFormModalVisible(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PALETTE.orange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} />

        {/* ---- Cartes stats ---- */}
        <View style={styles.topRow}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: PALETTE.blue }]} activeOpacity={0.7} onPress={() => setPesertaModalVisible(true)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabelLight}>Total Peserta</Text>
              <View style={styles.iconBoxLight}><Users size={16} color="#fff" /></View>
            </View>
            <Text style={styles.cardValueLight}>{stats.totalPax}</Text>
            <Text style={[styles.cardSubLight, { textDecorationLine: 'underline' }]}>Lihat Pecahan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { backgroundColor: PALETTE.orange, transform: [{ scale: showList ? 0.98 : 1 }] }]} activeOpacity={0.7} onPress={() => setShowList(!showList)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabelLight}>Bil. Latihan</Text>
              <View style={[styles.iconBoxLight, showList ? { backgroundColor: '#fff' } : null]}>
                <Calendar size={16} color={showList ? PALETTE.orange : '#fff'} />
              </View>
            </View>
            <Text style={styles.cardValueLight}>{stats.totalEvents}</Text>
            <Text style={[styles.cardSubLight, { fontWeight: 'bold', textDecorationLine: 'underline' }]}>{showList ? 'Tutup Senarai' : 'Lihat Senarai'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCardDark} activeOpacity={0.7} onPress={() => setPrestasiModalVisible(true)}>
            <View style={styles.darkDecorCircle} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabelLight}>Prestasi</Text>
              <View style={styles.iconBoxDark}><TrendingUp size={16} color={PALETTE.orange} /></View>
            </View>
            <Text style={styles.cardValueLight}>{stats.completionRate}%</Text>
            <Text style={[styles.cardSubLight, { textDecorationLine: 'underline' }]}>{stats.completed} Berjaya</Text>
          </TouchableOpacity>
        </View>

        {/* ---- Senarai Latihan ---- */}
        {showList ? (
          <View style={styles.sectionCard}>
            <View style={shared.sectionHeaderRow}>
              <Text style={shared.sectionHeaderTitle}>Senarai Latihan</Text>
              {isEditMode ? (
                <TouchableOpacity style={shared.addButton} onPress={handleOpenAdd}>
                  <Plus size={16} color="#fff" />
                  <Text style={shared.addButtonText}>Tambah</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {latihanList.map((item) => {
              const meta = statusMeta(item.status);
              return (
                <View key={item.id} style={styles.listItem}>
                  <View style={styles.dateCol}>
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
                          <TouchableOpacity onPress={() => handleOpenEdit(item)} style={[styles.itemActionBtn, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
                            <Edit size={14} color={PALETTE.orange} />
                          </TouchableOpacity>
                        </HoverTip>
                        <HoverTip label="Padam latihan ini">
                          <TouchableOpacity onPress={() => deleteLatihan(item.id)} style={[styles.itemActionBtn, { backgroundColor: 'rgba(220, 38, 38, 0.10)' }]}>
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
          </View>
        ) : null}

        {/* ---- Statistik Bulanan ---- */}
        <View style={styles.sectionCard}>
          <View style={shared.sectionHeaderRow}>
            <View>
              <Text style={shared.sectionHeaderTitle}>Statistik Bulanan</Text>
              <Text style={styles.sectionSub}>Tekan bar untuk lihat peratusan</Text>
            </View>
            <View style={styles.badgeBtn}>
              <Text style={styles.badgeText}>Tahunan</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {stats.monthsLabel.map((m, i) => (
              <AnimatedVerticalBar
                key={i} label={m}
                height={(stats.monthlyCounts[i] / stats.maxMonthVal) * 120}
                value={stats.monthlyCounts[i]} total={stats.totalRecordedEvents}
                color={PALETTE.blue} delay={i * 100}
                isSelected={hoveredMonthIndex === i}
                onPress={() => setHoveredMonthIndex(hoveredMonthIndex === i ? null : i)}
              />
            ))}
          </View>
        </View>

        {/* ---- Status Program + Kumpulan Sasaran ---- */}
        <View style={styles.splitRow}>
          <View style={[styles.sectionCard, { flex: 0.45, marginBottom: 0 }]}>
            <View style={shared.sectionHeaderRow}>
              <Text style={shared.sectionHeaderTitle}>Status Program</Text>
            </View>
            <StatusDonut completionRate={stats.completionRate} completed={stats.completed} upcoming={stats.upcoming} failed={stats.failed} />
          </View>

          <View style={[styles.sectionCard, { flex: 1, marginBottom: 0 }]}>
            <View style={shared.sectionHeaderRow}>
              <Text style={shared.sectionHeaderTitle}>Kumpulan Sasaran</Text>
            </View>
            {stats.audienceList.map((item, index) => (
              <View key={index} style={styles.progressRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.progressLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.progressPercent}>{item.percent}%</Text>
                </View>
                <AnimatedHorizontalBar widthPercent={item.percent} color={index % 2 === 0 ? PALETTE.blue : PALETTE.orange} delay={500 + (index * 150)} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <LatihanFormModal
        visible={isFormModalVisible}
        onClose={() => setFormModalVisible(false)}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
      />
      <PesertaModal visible={pesertaModalVisible} onClose={() => setPesertaModalVisible(false)} latihanList={latihanList} totalPax={stats.totalPax} />
      <PrestasiModal visible={prestasiModalVisible} onClose={() => setPrestasiModalVisible(false)} latihanList={latihanList} />
    </View>
  );
}