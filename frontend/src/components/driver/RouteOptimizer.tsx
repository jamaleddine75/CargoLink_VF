import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Clock, 
  Map as MapIcon, 
  ChevronRight, 
  GripVertical,
  Navigation,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Order } from '@/types';
import DriverOrderCard from './DriverOrderCard';
import routingService from '@/services/api/routingService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RouteOptimizerProps {
  orders: Order[];
  onReorder: (ids: string[]) => void;
}

interface SortableItemProps {
  order: Order;
  index: number;
}

const SortableItem: React.FC<SortableItemProps> = ({ order, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <DriverOrderCard 
        order={order} 
        routeBadge={index + 1}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

export const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ orders, onReorder }) => {
  const { user } = useAuth();
  const [isOptimizing, setIsOptimizing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stats = useMemo(() => {
    const totalDistance = orders.reduce((acc, o) => acc + (o.distance || 0), 0);
    const totalTime = orders.reduce((acc, o) => acc + (o.estimatedTime || 0), 0);
    
    return {
      distance: totalDistance.toFixed(1),
      time: Math.round(totalTime)
    };
  }, [orders]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orders.findIndex((o) => o.id === active.id);
      const newIndex = orders.findIndex((o) => o.id === over.id);
      const newOrder = arrayMove(orders, oldIndex, newIndex);
      onReorder(newOrder.map(o => o.id));
    }
  };

  const handleOptimize = async () => {
    if (!user?.id) return;
    
    setIsOptimizing(true);
    const orderIds = orders.map(o => o.id);
    
    try {
      toast.promise(
        routingService.optimizeDriverRoute(user.id, orderIds),
        {
          loading: 'Calcul de l\'itinéraire optimal...',
          success: (orderedIds) => {
            onReorder(orderedIds);
            return 'Itinéraire optimisé par l\'IA !';
          },
          error: 'Erreur lors de l\'optimisation'
        }
      );
    } catch (error) {
      console.error('Optimization failed', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Route Info Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">Distance Totale</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
                {stats.distance} <span className="text-[10px] font-bold text-slate-400">KM</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">Temps Estimé</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
                {stats.time} <span className="text-[10px] font-bold text-slate-400">MIN</span>
              </h3>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Draggable List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orders.map(o => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {orders.map((order, index) => (
                <SortableItem key={order.id} order={order} index={index} />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {/* Sticky Optimization Button */}
      <div className="sticky bottom-8 left-0 right-0 z-50 px-4 md:px-0 mt-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleOptimize}
            disabled={isOptimizing || orders.length < 2}
            className={cn(
              "w-full h-16 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all relative overflow-hidden group",
              isOptimizing ? "opacity-90" : "hover:shadow-primary/20"
            )}
          >
            {isOptimizing ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Optimisation...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 group-hover:animate-pulse" />
                <span>Ré-optimiser avec l'IA</span>
              </div>
            )}
            
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Button>
        </motion.div>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem]">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
            <Navigation className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Aucun itinéraire</h4>
            <p className="text-xs font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Ajoutez des missions pour commencer l'optimisation</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimizer;
