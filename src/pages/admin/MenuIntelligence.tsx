import MenuTable from "@/components/admin/MenuTable";

const MenuIntelligence = () => (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-display font-semibold text-card-foreground">Menu Intelligence</h2>
            <p className="text-sm text-muted-foreground mt-1">Detailed performance matrix and AI pricing strategies.</p>
        </div>
        <MenuTable />
    </div>
);

export default MenuIntelligence;
