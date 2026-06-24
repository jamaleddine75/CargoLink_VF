import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const IncidentPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-2">Signaler un problème</h1>
            <p className="text-muted-foreground">La page de déclaration d'incidents est en cours de développement.</p>
            <Button variant="outline" className="mt-8 rounded-xl font-bold" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
            </Button>
        </div>
    );
};

export default IncidentPage;