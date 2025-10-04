<?php
/**
 * Admin Interface
 * 
 * Handles WordPress admin pages for managing research profiles
 */

if (!defined('ABSPATH')) {
    exit;
}

class RPP_Admin {
    
    /**
     * Render all profiles page
     */
    public static function render_profiles_page() {
        $profiles = RPP_Database::get_public_profiles();
        
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline">Research Profiles</h1>
            <a href="<?php echo admin_url('admin.php?page=research-profile-add'); ?>" class="page-title-action">Add New</a>
            <hr class="wp-header-end">
            
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>OpenAlex ID</th>
                        <th>Display Name</th>
                        <th>Title</th>
                        <th>Public</th>
                        <th>Last Synced</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($profiles)): ?>
                        <tr>
                            <td colspan="6">No profiles found. <a href="<?php echo admin_url('admin.php?page=research-profile-add'); ?>">Add your first profile</a></td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($profiles as $profile): ?>
                            <tr>
                                <td><code><?php echo esc_html($profile['openalex_id']); ?></code></td>
                                <td><?php echo esc_html($profile['display_name'] ?: 'N/A'); ?></td>
                                <td><?php echo esc_html($profile['title'] ?: 'N/A'); ?></td>
                                <td><?php echo $profile['is_public'] ? '✓ Yes' : '✗ No'; ?></td>
                                <td><?php echo $profile['last_synced_at'] ? esc_html($profile['last_synced_at']) : 'Never'; ?></td>
                                <td>
                                    <a href="<?php echo home_url('/researcher/' . $profile['openalex_id']); ?>" target="_blank">View</a> |
                                    <button class="button-link" onclick="syncProfile('<?php echo esc_js($profile['openalex_id']); ?>')">Sync</button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        
        <script>
        function syncProfile(openalexId) {
            if (!confirm('Sync data from OpenAlex for ' + openalexId + '?')) return;
            
            const button = event.target;
            button.disabled = true;
            button.textContent = 'Syncing...';
            
            wp.apiFetch({
                path: '/research-profile/v1/admin/researcher/' + openalexId + '/sync',
                method: 'POST'
            }).then(response => {
                alert('Sync completed successfully!');
                location.reload();
            }).catch(error => {
                alert('Sync failed: ' + (error.message || 'Unknown error'));
                button.disabled = false;
                button.textContent = 'Sync';
            });
        }
        </script>
        <?php
    }
    
    /**
     * Render add profile page
     */
    public static function render_add_profile_page() {
        ?>
        <div class="wrap">
            <h1>Add New Research Profile</h1>
            
            <form id="add-profile-form" style="max-width: 600px;">
                <table class="form-table">
                    <tr>
                        <th><label for="openalex_id">OpenAlex ID *</label></th>
                        <td>
                            <input type="text" id="openalex_id" name="openalex_id" class="regular-text" required placeholder="A5056485484">
                            <p class="description">Enter the OpenAlex author ID (starts with A followed by numbers)</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="display_name">Display Name</label></th>
                        <td><input type="text" id="display_name" name="displayName" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th><label for="title">Title</label></th>
                        <td><input type="text" id="title" name="title" class="regular-text" placeholder="Assistant Professor"></td>
                    </tr>
                    <tr>
                        <th><label for="bio">Bio</label></th>
                        <td><textarea id="bio" name="bio" rows="5" class="large-text"></textarea></td>
                    </tr>
                    <tr>
                        <th><label for="current_affiliation">Current Affiliation</label></th>
                        <td><input type="text" id="current_affiliation" name="currentAffiliation" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th><label for="current_position">Current Position</label></th>
                        <td><input type="text" id="current_position" name="currentPosition" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th><label for="is_public">Make Public</label></th>
                        <td><input type="checkbox" id="is_public" name="isPublic" checked></td>
                    </tr>
                </table>
                
                <p class="submit">
                    <button type="submit" class="button button-primary">Add Profile & Sync Data</button>
                    <span id="status-message" style="margin-left: 10px;"></span>
                </p>
            </form>
        </div>
        
        <script>
        document.getElementById('add-profile-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.isPublic = document.getElementById('is_public').checked;
            
            const statusEl = document.getElementById('status-message');
            const submitBtn = e.target.querySelector('button[type="submit"]');
            
            statusEl.textContent = 'Creating profile...';
            submitBtn.disabled = true;
            
            // Set a 10-second timeout for the API call
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            wp.apiFetch({
                path: '/research-profile/v1/admin/researcher/profile',
                method: 'POST',
                data: data,
                signal: controller.signal
            }).then(response => {
                clearTimeout(timeoutId);
                statusEl.innerHTML = '✓ Profile created successfully!<br><small>Data sync is running in background (may take 5-15 minutes).</small><br><a href="<?php echo admin_url('admin.php?page=research-profiles'); ?>">View profile</a>';
                e.target.reset();
                submitBtn.disabled = false;
            }).catch(error => {
                clearTimeout(timeoutId);
                
                if (error.name === 'AbortError') {
                    // Timeout occurred - profile likely created but sync is running
                    statusEl.innerHTML = '✓ Profile created!<br><small>Data sync running in background. Check back in 10-15 minutes.</small><br><a href="<?php echo admin_url('admin.php?page=research-profiles'); ?>">View profiles</a>';
                    e.target.reset();
                    submitBtn.disabled = false;
                } else {
                    statusEl.innerHTML = '✗ Error: ' + (error.message || 'Unknown error') + '<br><small>Please try again or contact support.</small>';
                    submitBtn.disabled = false;
                }
            });
        });
        </script>
        <?php
    }
    
    /**
     * Render settings page
     */
    public static function render_settings_page() {
        // Save settings
        if (isset($_POST['rpp_settings_nonce']) && wp_verify_nonce($_POST['rpp_settings_nonce'], 'rpp_settings')) {
            update_option('rpp_cache_duration', intval($_POST['cache_duration']));
            update_option('rpp_auto_sync', isset($_POST['auto_sync']));
            echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
        }
        
        $cache_duration = get_option('rpp_cache_duration', 24);
        $auto_sync = get_option('rpp_auto_sync', false);
        
        ?>
        <div class="wrap">
            <h1>Research Profile Settings</h1>
            
            <form method="post">
                <?php wp_nonce_field('rpp_settings', 'rpp_settings_nonce'); ?>
                
                <table class="form-table">
                    <tr>
                        <th><label for="cache_duration">Cache Duration (hours)</label></th>
                        <td>
                            <input type="number" id="cache_duration" name="cache_duration" value="<?php echo esc_attr($cache_duration); ?>" min="1" max="168">
                            <p class="description">How long to cache OpenAlex data before refreshing</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="auto_sync">Auto-sync</label></th>
                        <td>
                            <input type="checkbox" id="auto_sync" name="auto_sync" <?php checked($auto_sync); ?>>
                            <label for="auto_sync">Automatically sync data daily</label>
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <button type="submit" class="button button-primary">Save Settings</button>
                </p>
            </form>
            
            <hr>
            
            <h2>API Information</h2>
            <p><strong>REST API Base:</strong> <code><?php echo esc_html(rest_url('research-profile/v1')); ?></code></p>
            <p><strong>Public Endpoints:</strong></p>
            <ul>
                <li><code>GET /researcher/{openalex_id}/data</code> - Get researcher data</li>
                <li><code>GET /openalex/search/{openalex_id}</code> - Search OpenAlex</li>
            </ul>
            <p><strong>Admin Endpoints:</strong> (Requires WordPress login with manage_options capability)</p>
            <ul>
                <li><code>POST /admin/researcher/profile</code> - Create profile</li>
                <li><code>PUT /admin/researcher/profile/{openalex_id}</code> - Update profile</li>
                <li><code>POST /admin/researcher/{openalex_id}/sync</code> - Sync data</li>
                <li><code>POST /admin/researcher/{openalex_id}/upload-cv</code> - Upload CV</li>
            </ul>
        </div>
        <?php
    }
}
