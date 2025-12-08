import { useState } from 'react';
import { useApp } from '../store/context';
import { ClothingItem, PackingList } from '../types';
import { Plus, Check, X, Luggage, Calendar, MapPin, Trash2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export function Packing() {
  const { state, dispatch } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [listName, setListName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewingList, setViewingList] = useState<PackingList | null>(null);

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const createList = () => {
    if (listName && startDate && endDate && selectedItems.length > 0) {
      const newList: PackingList = {
        id: uuidv4(),
        name: listName,
        destination: destination || undefined,
        startDate,
        endDate,
        itemIds: selectedItems,
        outfitIds: [],
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_PACKING_LIST', payload: newList });
      resetForm();
    }
  };

  const resetForm = () => {
    setIsCreating(false);
    setListName('');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setSelectedItems([]);
  };

  const deleteList = (id: string) => {
    dispatch({ type: 'DELETE_PACKING_LIST', payload: id });
    if (viewingList?.id === id) {
      setViewingList(null);
    }
  };

  const suggestItems = () => {
    if (!startDate || !endDate) return;

    const days = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
    const suggested: string[] = [];

    // Suggest based on trip length
    const tops = state.items.filter(i => i.category === 'tops');
    const bottoms = state.items.filter(i => i.category === 'bottoms');
    const shoes = state.items.filter(i => i.category === 'shoes');
    const outerwear = state.items.filter(i => i.category === 'outerwear');

    // Add tops (1 per day + 1 extra)
    tops.slice(0, Math.min(days + 1, tops.length)).forEach(i => suggested.push(i.id));

    // Add bottoms (1 per 2 days)
    bottoms.slice(0, Math.min(Math.ceil(days / 2), bottoms.length)).forEach(i => suggested.push(i.id));

    // Add 2 pairs of shoes
    shoes.slice(0, 2).forEach(i => suggested.push(i.id));

    // Add 1 outerwear
    if (outerwear.length > 0) {
      suggested.push(outerwear[0].id);
    }

    setSelectedItems(suggested);
  };

  if (viewingList) {
    const listItems = viewingList.itemIds
      .map(id => state.items.find(i => i.id === id))
      .filter(Boolean) as ClothingItem[];

    const groupedItems = listItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ClothingItem[]>);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewingList(null)}
            className="text-primary-600 text-sm font-medium"
          >
            ← Back
          </button>
          <button
            onClick={() => deleteList(viewingList.id)}
            className="text-red-500 text-sm font-medium"
          >
            Delete
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{viewingList.name}</h2>
          {viewingList.destination && (
            <p className="flex items-center gap-1 text-gray-500 mt-1">
              <MapPin className="w-4 h-4" />
              {viewingList.destination}
            </p>
          )}
          <p className="flex items-center gap-1 text-gray-500 mt-1">
            <Calendar className="w-4 h-4" />
            {format(parseISO(viewingList.startDate), 'MMM d')} -{' '}
            {format(parseISO(viewingList.endDate), 'MMM d, yyyy')}
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                {category} ({items.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {items.map(item => (
                  <div key={item.id} className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500">
          {viewingList.itemIds.length} items packed
        </p>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Packing List</h2>
          <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          placeholder="Trip name (e.g., Beach Vacation)"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
        />

        <input
          type="text"
          placeholder="Destination (optional)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
            />
          </div>
        </div>

        {startDate && endDate && (
          <button
            onClick={suggestItems}
            className="w-full py-2 bg-primary-100 text-primary-700 font-medium rounded-xl hover:bg-primary-200 transition-colors"
          >
            Auto-suggest items for {differenceInDays(parseISO(endDate), parseISO(startDate)) + 1} days
          </button>
        )}

        <div>
          <p className="text-sm text-gray-500 mb-2">
            {selectedItems.length} items selected
          </p>
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {state.items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`relative aspect-square rounded-lg overflow-hidden ${
                  selectedItems.includes(item.id) ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {selectedItems.includes(item.id) && (
                  <div className="absolute inset-0 bg-primary-500/30 flex items-center justify-center">
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={createList}
          disabled={!listName || !startDate || !endDate || selectedItems.length === 0}
          className="w-full py-4 bg-primary-500 text-white font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Create Packing List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Packing Lists</h1>

      {state.packingLists.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Luggage className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">No packing lists yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create a packing list for your next trip
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create List
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {state.packingLists.map((list) => (
            <button
              key={list.id}
              onClick={() => setViewingList(list)}
              className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{list.name}</h3>
                  {list.destination && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {list.destination}
                    </p>
                  )}
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {list.itemIds.length} items
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(parseISO(list.startDate), 'MMM d')} -{' '}
                {format(parseISO(list.endDate), 'MMM d')}
              </p>
            </button>
          ))}
        </div>
      )}

      {state.packingLists.length > 0 && (
        <button
          onClick={() => setIsCreating(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
