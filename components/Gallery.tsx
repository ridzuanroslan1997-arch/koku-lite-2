import React, { useState } from 'react';
import { ActivityReport, User, UserRole } from '../types';
import { Image as ImageIcon, Calendar, X, ZoomIn } from 'lucide-react';

interface GalleryProps {
  reports: ActivityReport[];
  currentUser: User;
}

export const Gallery: React.FC<GalleryProps> = ({ reports, currentUser }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Filter reports visible to user and having images
  const visibleReports = reports.filter(r => {
     const hasImages = r.images && r.images.length > 0;
     const isSubmitted = r.status === 'SUBMITTED';
     
     if (!hasImages || !isSubmitted) return false;

     if (currentUser.role === UserRole.GURU_PENASIHAT) {
         return r.unitId === currentUser.assignedUnitId;
     }
     // Admin sees all
     return true;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-7xl mx-auto pb-12">
        {/* Lightbox Modal */}
        {selectedImage && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
                <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 p-2">
                    <X size={32} />
                </button>
                <img src={selectedImage} alt="Full view" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            </div>
        )}

        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon className="text-purple-600" />
                Galeri Aktiviti
            </h1>
            <p className="text-gray-500 text-sm mt-1">Koleksi gambar aktiviti daripada laporan yang telah dihantar.</p>
        </div>

        {visibleReports.length === 0 ? (
            <div className="bg-white p-16 rounded-xl border-2 border-dashed border-gray-300 text-center">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-500 font-medium">Tiada gambar dijumpai</h3>
                <p className="text-sm text-gray-400">Pastikan laporan aktiviti dihantar berserta gambar.</p>
            </div>
        ) : (
            <div className="space-y-12">
                {visibleReports.map((report) => (
                    <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{report.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar size={14} />
                                    {new Date(report.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full self-start sm:self-center">
                                {report.images?.length} Gambar
                            </span>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {report.images?.map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100 border border-gray-200 hover:shadow-md transition-all"
                                        onClick={() => setSelectedImage(img)}
                                    >
                                        <img src={img} alt={`Aktiviti ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <ZoomIn className="text-white drop-shadow-md" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};