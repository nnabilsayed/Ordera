import React from 'react';
import { View, TextInput, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { THEME } from '../utils';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  filterOptions?: string[];
  badgeCounts?: Record<string, number>;
}


export const FilterBar = ({ 
    searchQuery, 
    setSearchQuery, 
    activeFilter, 
    setActiveFilter, 
    filterOptions = ['All', 'Active', 'Out of Stock', 'Newest'],
    badgeCounts = {} 
}: FilterBarProps) => {
  
  return (
    <View style={styles.container}>
      {/* Search Input */}
      <TextInput
        style={styles.input}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search..."
        placeholderTextColor={THEME.textSecondary}
      />

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.chipContainer}
      >
        {filterOptions.map((filter) => {
            const isActive = activeFilter === filter;
            return (
                <TouchableOpacity 
                    key={filter} 
                    style={[styles.chip, isActive && styles.activeChip]}
                    onPress={() => setActiveFilter(filter)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                        {filter}
                    </Text>
                    {!!badgeCounts[filter] && (
                        <View style={{
                            position: 'absolute',
                            top: -8,
                            right: -6,
                            zIndex: 99,
                            backgroundColor: '#EF4444',
                            borderRadius: 10,
                            minWidth: 20,
                            height: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2,
                            borderColor: 'white',
                            elevation: 4,
                        }}>
                             <Text style={{color: 'white', fontSize: 10, fontWeight: '800', paddingHorizontal: 4}}>
                                {badgeCounts[filter]}
                             </Text>
                        </View>
                    )}
                </TouchableOpacity>
            );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    overflow: 'visible',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  chipContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    overflow: 'visible',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'visible',
  },
  activeChip: {
    backgroundColor: THEME.text, // Black/Dark
    borderColor: THEME.text,
  },
  chipText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 13,
  },
  activeChipText: {
    color: 'white',
  },
});
